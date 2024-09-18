const db = require("../../services/db.js");
const { DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/apiResponse.js");
const { nightsBetweenDates, parseCheckInDate } = require("../../services/timeService");

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const { id } = JSON.parse(event.body);
  console.log("id", id);
  const Params = {
    id: `${id}`,
  };

  try {
    let cancelDate = new Date().toISOString();
    console.log("cancelDate", cancelDate);
    let room = await db.send(
      new GetCommand({
        TableName: orderTable,
        Key: {
          orderId: id,
        },
      }),
    );
    console.log("room", room);

    console.log("room.checkIn", room.Item.checkInDate);
    let nights = nightsBetweenDates(cancelDate, room.Item.checkInDate);
    console.log("nights", nights);
    if (nights < 2) {
      return apiResponse(200, {
        message: "The booking cannot be canceled, less than two days before checkout date.",
      });
    }

    let response = await db.send(
      new DeleteCommand({
        TableName: orderTable,
        Item: Params,
      }),
    );
    console.log(" response", nights);
    if (response) {
      return apiResponse(200, { message: "Booking canceled successfully." });
    } else {
      return apiResponse(400, { message: "Booking not canceled." });
    }
  } catch (error) {
    return apiResponse(500, { error: error.message });
  }
};
