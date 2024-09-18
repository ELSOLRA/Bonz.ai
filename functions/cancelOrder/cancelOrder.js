const db = require("../../services/db.js");
const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/apiResponse.js");

exports.cancelOrder = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const { id } = JSON.parse(event.body);

  const deleteParams = {
    id: `${id}`,
  };

  try {
    let response = await db.send(
      new DeleteCommand({
        TableName: orderTable,
        Item: deleteParams,
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
