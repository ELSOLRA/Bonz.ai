const db = require("../../services/db.js");
const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");

exports.cancelOrder = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const { id } = JSON.parse(event.body);

  const deleteParams = {
    id: `${id}`,
  };

  try {
    let result = await db.send(
      new DeleteCommand({
        TableName: orderTable,
        Item: deleteParams,
      }),
    );
    if (result) {
      return apiResponse(200, { message: "Booking canceled successfully." });
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Booking not canceled." }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
