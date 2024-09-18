const db = require("../../services/db.js");
const { getRoomData } = require("../../services/getRoomData.js");
const {
  nightsBetweenDates,
  parseCheckInDate,
  parseCheckOutDate,
} = require("../../services/timeService.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
// Följande detaljer kan ändras i en bokning men logiken för rummen ska följas om antalet gäster eller rum ändras:
// Antal gäster
// Vilka rumstyper och antal
// Datum för in-och utcheckning

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const roomTable = process.env.ROOM_TABLE;
  const { orderId } = event.pathParameters;
  const { guestAmount, rooms, checkInDate, checkOutDate } = JSON.parse(event.body);

  try {
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

    const nights = nightsBetweenDates(
      parseCheckInDate(checkInDate),
      parseCheckOutDate(checkOutDate),
    );

    let totalCapacity = 0;
    let totalPrice = 0;
    // const bookingDetails = [];
    const roomUpdates = [];

    for (const room of rooms) {
      const roomData = await getRoomData(room.type);

      if (!roomData || !room.amount) {
        throw new Error(`Invalid room type - ${room.type}, or no amount provided`);
      }

      const orderRoomAmount = order.Item.rooms.find((r) => r.type === room.type)?.amount || 0;
      const roomAmountDiff = room.amount - orderRoomAmount;

      const changedTotal = roomData.total - roomAmountDiff;

      if (changedTotal < 0) {
        throw new Error(
          `Not enough ${room.type} available. Requested more: ${roomAmountDiff}, Available: ${roomData.total}`,
        );
      }

      const capacityCount = roomData.max_guests * room.amount;
      totalCapacity += capacityCount;

      const roomTypePrice = roomData.price_per_night * room.amount * nights;
      totalPrice += roomTypePrice;

      /*       bookingDetails.push({
        type: room.type,
        amount: room.amount,
        pricePerNight: roomData.price_per_night,
        totalPrice: roomTypePrice,
      }); */

      roomUpdates.push({
        type: room.type,
        newTotal: changedTotal,
      });
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
        "SET guestAmount = :guestAmount, checkInDate = :checkInDate, checkOutDate = :checkOutDate, rooms =:rooms, totalPrice = :totalPrice ",
      // ExpressionAttributeName:,
      ExpressionAttributeValues: {
        ":guestAmount": guestAmount,
        ":checkInDate": checkInDate,
        ":checkOutDate": checkOutDate,
        ":rooms": rooms,
        ":totalPrice": totalPrice,
      },
      ReturnValues: "ALL_NEW",
    };

    /* const updatedOrder = */ await db.send(new UpdateCommand(updateParams));

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
      // ...updatedOrder.Attributes,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return apiResponse(400, { error: error.message });
  }
};
