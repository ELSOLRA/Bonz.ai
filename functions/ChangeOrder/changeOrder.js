const db = require("../../services/db.js");
const { getRoomData } = require("../../utils/getRoomData.js");
const {
  nightsBetweenDates,
  parseCheckInDate,
  parseCheckOutDate,
} = require("../../utils/timeDateOperations.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { validateUpdate } = require("../../utils/validateData.js");

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const roomTable = process.env.ROOM_TABLE;
  const { orderId } = event.pathParameters;
  const { guestAmount, rooms, checkInDate, checkOutDate } = JSON.parse(event.body);

  try {
    //validate update
    validateUpdate(guestAmount, rooms, checkInDate, checkOutDate);

    const parsedCheckInDate = parseCheckInDate(checkInDate);
    const parsedCheckOutDate = parseCheckOutDate(checkOutDate);
    const nights = nightsBetweenDates(parsedCheckInDate, parsedCheckOutDate);

    const params = {
      TableName: orderTable,
      Key: {
        orderId,
      },
    };

    const order = await db.send(new GetCommand(params));

    if (!order.Item) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const roomsInOrder = order.Item.rooms;

    let updatedRooms = [...roomsInOrder];

    const roomUpdates = [];

    for (const newRoom of rooms) {
      const existingRoomIndex = updatedRooms.findIndex((r) => r.type === newRoom.type);

      if (existingRoomIndex !== -1) {
        // if room type exists in the order we update its amount
        const existingRoom = updatedRooms[existingRoomIndex];
        const amountDiff = newRoom.amount - existingRoom.amount;

        if (amountDiff !== 0) {
          const roomData = await getRoomData(newRoom.type);
          const newTotal = roomData.total - amountDiff;

          if (newTotal < 0) {
            throw new Error(
              `Not enough ${newRoom.type} available. Requested change: ${amountDiff}, Available: ${roomData.total}`,
            );
          }

          updatedRooms[existingRoomIndex].amount = newRoom.amount;

          roomUpdates.push({
            type: newRoom.type,
            newTotal: newTotal,
          });
        }
      } else {
        // if neew room type, we add it to the order
        const roomData = await getRoomData(newRoom.type);
        const newTotal = roomData.total - newRoom.amount;

        if (newTotal < 0) {
          throw new Error(
            `Not enough ${newRoom.type} available. Requested: ${newRoom.amount}, Available: ${roomData.total}`,
          );
        }

        updatedRooms.push(newRoom);

        roomUpdates.push({
          type: newRoom.type,
          newTotal: newTotal,
        });
      }
    }

    // Removing rooms with amount 0
    updatedRooms = updatedRooms.filter((room) => room.amount > 0);

    // Recalculating total price and capacity
    let totalCapacity = 0;
    let totalPrice = 0;

    for (const room of updatedRooms) {
      const roomData = await getRoomData(room.type);
      totalCapacity += roomData.max_guests * room.amount;
      totalPrice += roomData.price_per_night * room.amount * nights;
    }

    if (totalCapacity < guestAmount) {
      throw new Error(
        `Not enough capacity. Booked capacity: ${totalCapacity}, Guests: ${guestAmount}`,
      );
    }

    const updateParams = {
      TableName: orderTable,
      Key: { orderId },
      UpdateExpression:
        "SET guestAmount = :guestAmount, checkInDate = :checkInDate, checkOutDate = :checkOutDate, rooms = :rooms, totalPrice = :totalPrice",
      ExpressionAttributeValues: {
        ":guestAmount": guestAmount,
        ":checkInDate": parsedCheckInDate,
        ":checkOutDate": parsedCheckOutDate,
        ":rooms": updatedRooms,
        ":totalPrice": totalPrice,
      },
      ReturnValues: "ALL_NEW",
    };

    const updatedOrder = await db.send(new UpdateCommand(updateParams));

    // Updating room totals
    for (const update of roomUpdates) {
      await db.send(
        new UpdateCommand({
          TableName: roomTable,
          Key: { type: update.type },
          UpdateExpression: "SET #total = :newTotal",
          ExpressionAttributeNames: { "#total": "total" },
          ExpressionAttributeValues: { ":newTotal": update.newTotal },
        }),
      );
    }

    return apiResponse(200, {
      message: "Order updated successfully",
      orderId,
      ...updatedOrder.Attributes,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return apiResponse(400, { error: error.message });
  }
};
