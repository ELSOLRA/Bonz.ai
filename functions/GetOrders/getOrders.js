const db = require("../../services/db.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;

  try {
    const result = await db.send(new ScanCommand({ TableName: orderTable }));

    return apiResponse(200, {
      message: "data displayed succesfully",
      data: result.Items,
    });
  } catch (error) {
    return {
      statusCode: 500,
      message: "Failed to fetch items",
    };
  }
};
