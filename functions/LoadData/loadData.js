const db = require("../../services/db");
const roomsData = require("../../data/rooms.json");
const uuid = require("uuid");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/apiResponse");

exports.handler = async (event) => {
  const roomTable = process.env.RUM_TABLE;
  const roomId = uuid.v4();
  try {
    const putParams = roomsData.map((item) => ({
      putRequest: {
        TableName: roomTable,
        Item: {
          roomId: roomId,
          type: item.type,
          price_per_night: item.price_per_night,
          max_number_of_people: item.max_number_of_people,
          occupied: item.occupied,
        },
      },
    }));

    await db.send(new PutCommand(putParams));
    return apiResponse(201, {
      success: true,
      message: "data loaded successfully",
    });
  } catch (error) {
    return apiResponse(500, {
      success: false,
      message: "Failed to load",
      error: error,
    });
  }
};
