const { db, PutCommand } = require("../services/db");
const { v4: uuidv4 } = require("uuid");
const rooms = require("../data/rooms.json");
const { apiResponse } = require("../utils/apiResponse");
const { checkAvailability } = require("../utils/checkAvailability");

exports.handler = async (event) => {
  try {
    const { guests, roomType } = JSON.parse(event.body);

    // Validate input
    const room = rooms.find((r) => r.type === roomType);

    if (!room || guests > room.max_guests) {
      return apiResponse(400, {
        success: false,
        message: "Invalid room type or too many guests",
      });
    }

    // Check availability
    const availability = await checkAvailability(roomType);

    if (!availability.success) {
      return apiResponse(400, {
        success: false,
        message: "No more rooms of this type available",
      });
    }

    // Prepare data to be saved
    const bookingId = uuidv4();
    const totalPrice = room.price_per_night;

    const params = {
      TableName: process.env.BOOKING_TABLE,
      Item: {
        bookingId,
        roomType,
        guests,
        totalPrice,
        bookedAt: new Date().toISOString(),
      },
    };

    // Save booking in DynamoDB
    await db.send(new PutCommand(params));

    return apiResponse(201, {
      success: true,
      message: "Room booked successfully",
      bookingId,
    });
  } catch (error) {
    console.error("Error in booking room:", error);

    return apiResponse(500, {
      success: false,
      message: "Internal server error",
      error: error.message || error,
    });
  }
};
