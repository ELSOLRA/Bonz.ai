const db = require("../../services/db.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { getRoomData } = require("../../services/getRoomData");
const { nightsBetweenDates } = require("../../services/timeService");

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const roomTable = process.env.ROOM_TABLE;
  const { orderId } = event.pathParameters;
  const { guestAmount, rooms, checkInDate, checkOutDate } = JSON.parse(event.body);

  try {
    const getParams = {
      TableName: orderTable,
      Key: { orderId },
    };
    
    const existingOrderResult = await db.send(new GetCommand(getParams));
    const existingOrder = existingOrderResult.Item;

    if (!existingOrder) {
      return apiResponse(404, { error: "Order not found" });
    }

    const roomUpdates = [];
    const existingRoomTypes = new Map(existingOrder.rooms.map(r => [r.type, r.roomAmount]));
    const updatedRoomTypes = new Map(rooms.map(r => [r.type, r.roomAmount]));
    let totalPrice = 0;
    const nights = nightsBetweenDates(checkInDate, checkOutDate);

    for (const [type, updatedAmount] of updatedRoomTypes) {
      const currentAmount = existingRoomTypes.get(type) || 0;
      const difference = updatedAmount - currentAmount;

      const roomData = await getRoomData(type);
      if (!roomData) {
        throw new Error(`Room data not found for type: ${type}`);
      }

      totalPrice += roomData.price_per_night * updatedAmount * nights;

      const newTotal = roomData.total - difference;

      roomUpdates.push({
        type,
        newTotal,
        difference 
      });
    }

    for (const [type, existingAmount] of existingRoomTypes) {
      if (!updatedRoomTypes.has(type)) {
        const roomData = await getRoomData(type);
        if (!roomData) {
          throw new Error(`Room data not found for type: ${type}`);
        }

        const difference = -existingAmount;
        roomUpdates.push({
          type,
          newTotal: roomData.total - difference, 
          difference 
        });
      }
    }

    const updateParams = {
      TableName: orderTable,
      Key: { orderId },
      UpdateExpression: "SET guestAmount = :guestAmount, rooms = :rooms, checkInDate = :checkInDate, checkOutDate = :checkOutDate, totalPrice = :totalPrice",
      ExpressionAttributeValues: {
        ":guestAmount": guestAmount,
        ":rooms": rooms,
        ":checkInDate": checkInDate,
        ":checkOutDate": checkOutDate,
        ":totalPrice": totalPrice,
      },
      ReturnValues: "ALL_NEW",
    };

    const updatedResult = await db.send(new UpdateCommand(updateParams));
    

    for (const update of roomUpdates) {
      const { type, difference } = update;


      await db.send(new UpdateCommand({
        TableName: roomTable,
        Key: { type }, 
        UpdateExpression: "SET #total = #total + :difference",
        ExpressionAttributeNames: { "#total": "total" },
        ExpressionAttributeValues: { ":difference": difference },
      }));
    }

    return apiResponse(200, { message: "Order updated successfully", updatedOrder: updatedResult.Attributes });
  } catch (error) {
    console.error("Error updating order:", error);
    return apiResponse(400, { error: error.message });
  }
};
