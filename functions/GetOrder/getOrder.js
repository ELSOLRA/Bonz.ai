const db = require("../../services/db.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;

  const { orderId } = event.pathParameters;

  try {
    const params = {
      TableName: orderTable,
      Key: {
        orderId,
      },
    };

    const result = await db.send(new GetCommand(params));

    if (!result.Item) {
      return {
        statusCode: 400,
        message: "order not found",
      };
    }

    const { totalPrice, ...orderDetails } = result.Item;
    //       Bokningsnummer
    // In-och utcheckningsdatum
    // Antal gäster
    // Antalet rum
    // Namn på den som bokade rummet
    return apiResponse(200, {
      message: "Order displayed succesfully",

      data: orderDetails,
    });
  } catch (error) {
    return {
      statusCode: 500,
      message: "Failed to fetch items",
    };
  }
};
