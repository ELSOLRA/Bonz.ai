const db = require("../../services/db.js");
const { DeleteCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/apiResponse.js");
const { nightsBetweenDates } = require("../../services/timeService");

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const roomTable = process.env.ROOM_TABLE;
  const { id } = JSON.parse(event.body);

  try {
    let room = await db.send(
      new GetCommand({
        TableName: orderTable,
        Key: {
          orderId: id,
        },
      }),
    );

    const { checkInDate, rooms } = room.Item;

    let cancelDate = new Date().toISOString();

    let nights = nightsBetweenDates(cancelDate, checkInDate);

    if (nights < 2) {
      return apiResponse(200, {
        message: "The booking cannot be canceled, less than two days before checkout date.",
      });
    }

    for (const bookedRooms of rooms) {
      const { type, amount } = bookedRooms;
      await db.send(
        new UpdateCommand({
          TableName: roomTable,
          Key: { type },
          UpdateExpression: "SET #total =  #total + :amount",
          ExpressionAttributeNames: { "#total": "total" },
          ExpressionAttributeValues: { ":amount": amount },
        }),
      );
    }

    let response = await db.send(
      new DeleteCommand({
        TableName: orderTable,
        Key: {
          orderId: id,
        },
      }),
    );

    if (response) {
      return apiResponse(200, { message: "Booking canceled successfully." });
    } else {
      return apiResponse(400, { message: "Booking not canceled." });
    }
  } catch (error) {
    return apiResponse(500, { error: error.message });
  }
};
