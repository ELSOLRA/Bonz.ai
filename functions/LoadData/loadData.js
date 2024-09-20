const db = require("../../services/db");
const roomsData = require("../../data/rooms.json");
const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { apiResponse } = require("../../utils/apiResponse");

exports.handler = async () => {
  const roomTable = process.env.ROOM_TABLE;

  try {
    // Check if the table already has data
    const existingRooms = await db.send(
      new ScanCommand({
        TableName: roomTable,
        Limit: 1, // Only need to know if any data exists
      }),
    );

    if (existingRooms.Items && existingRooms.Items.length > 0) {
      return apiResponse(409, {
        success: false,
        message: "Data already exists. No new data loaded.",
      });
    }

    // If no data exists, load the room data
    for (const room of roomsData) {
      await db.send(
        new PutCommand({
          TableName: roomTable,
          Item: {
            type: room.type,
            price_per_night: room.price_per_night,
            max_guests: room.max_guests,
            total: room.total,
          },
        }),
      );
    }

    return apiResponse(201, {
      success: true,
      message: "Data loaded successfully",
    });
  } catch (error) {
    console.error("Error loading data:", error);
    return apiResponse(500, {
      success: false,
      message: "Failed to load data",
      error: error.message,
    });
  }
};
