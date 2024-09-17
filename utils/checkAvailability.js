const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { db } = require("../services/db");
const rooms = require("../data/rooms.json"); // Import static room data

exports.checkAvailability = async (roomType) => {
  try {
    // Find the room type from the static data
    const room = rooms.find((r) => r.type === roomType);

    if (!room) {
      throw new Error(`Room type ${roomType} not found`);
    }

    // Get count of booked rooms for the specified roomType
    const params = {
      TableName: "hotel-booking-api-bookings",
      FilterExpression: "#roomType = :roomTypeVal",
      ExpressionAttributeNames: {
        "#roomType": "roomType",
      },
      ExpressionAttributeValues: {
        ":roomTypeVal": roomType,
      },
      Select: "COUNT",
    };

    const result = await db.send(new ScanCommand(params));

    const bookedCount = result.Count;
    const availableCount = room.total - bookedCount;

    console.log(`Number of ${roomType} rooms booked: ${bookedCount}`);
    console.log(`Number of ${roomType} rooms available: ${availableCount}`);

    return {
      success: availableCount > 0,
      availableCount,
    };
  } catch (error) {
    console.error("Error checking availability:", error);

    return {
      success: false,
      message: "Error occurred while checking availability",
      error: error.message || error,
    };
  }
};
