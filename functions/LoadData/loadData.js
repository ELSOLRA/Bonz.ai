const db = require("../../services/db");
const roomsData = require("../../data/rooms.json");
// const uuid = require("uuid");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/apiResponse");

exports.handler = async (event) => {
  const roomTable = process.env.ROOM_TABLE;
  // const roomId = uuid.v4();
  try {

    for (const rooms of roomsData){
      await db.send(new PutCommand({
          TableName: roomTable,
          Item: {
            type: rooms.type,
            price_per_night: rooms.price_per_night,
            max_number_of_people: rooms.max_guests,
            total: rooms.total,
          },
          }))
        }
    /*
    const putParams = roomsData.map((item) => ({
      putRequest: {
        TableName: roomTable,
        Item: {
          type: item.type,
          price_per_night: item.price_per_night,
          max_number_of_people: item.max_guests,
          total: item.total,
        },
      },
    }));
*/
    //await db.send(new PutCommand(putParams));
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
