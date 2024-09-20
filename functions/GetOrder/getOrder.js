const db = require("../../services/db.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;

  const { orderId } = event.pathParameters;

  try {
    // Set up parameters for the GetCommand to fetch the order
    const params = {
      TableName: orderTable,
      Key: {
        orderId,
      },
    };

    const result = await db.send(new GetCommand(params));

    // Check if the order was found; if not, return a 400 respons
    if (!result.Item) {
      return {
        statusCode: 400,
        message: "order not found",
      };
    }

    const { totalPrice, ...orderDetails } = result.Item;
    
    // Return a successful response with the order details
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
