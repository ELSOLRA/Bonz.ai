const { PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const db = require("../../services/db");
const uuid = require("uuid");
const { apiResponse } = require("../../utils/apiResponse");
const { getRoomData } = require("../../utils/getRoomData");
const {
  parseCheckInDate,
  parseCheckOutDate,
  nightsBetweenDates,
} = require("../../utils/timeDateOperations");
const { validateOrder } = require("../../utils/validateData")

exports.handler = async (event) => {
  try {
    const { name, checkIn, checkOut, guestAmount, types } = JSON.parse(event.body);

    //validate order
    validateOrder(name, checkIn, checkOut, guestAmount, types);

    const roomTable = process.env.ROOM_TABLE;
    const orderTable = process.env.ORDER_TABLE;
    // initializing variables for booking calculations
    let totalCapacity = 0;
    let totalPrice = 0;
    const bookingDetails = [];
    const roomUpdates = [];

    const checkInDate = parseCheckInDate(checkIn);


    const checkOutDate = parseCheckOutDate(checkOut);

    // calculates spent nights 
    const nights = nightsBetweenDates(checkInDate, checkOutDate);


    for (const roomType of types) {
      const roomData = await getRoomData(roomType.type);

      if (!roomData || !roomType.roomAmount) {
        throw new Error(`Invalid room type - ${roomType.type}, or no amount provided`);
      }

      if (isNaN(roomData.max_guests)) {
        throw new Error(`Invalid max_guests value for ${roomType.type}: ${roomData.max_guests}`);
      }

      if (isNaN(roomType.roomAmount)) {
        throw new Error(`Invalid roomAmount for ${roomType.type}: ${roomType.roomAmount}`);
      }

      if (roomData.total < roomType.roomAmount) {
        throw new Error(
          `Not enough ${roomType.type} available. Requested: ${roomType.roomAmount}, Available: ${roomData.total}`,
        );
      }

      const capacityIncrement = roomData.max_guests * roomType.roomAmount;

      totalCapacity += capacityIncrement;
      const roomTypePrice = roomData.price_per_night * roomType.roomAmount * nights;


      totalPrice += roomTypePrice;


      bookingDetails.push({
        type: roomType.type,
        amount: roomType.roomAmount,
        pricePerNight: roomData.price_per_night,
        totalPrice: roomTypePrice,
      });

      roomUpdates.push({
        type: roomType.type,
        newTotal: roomData.total - roomType.roomAmount,
      });
    }

    if (isNaN(totalCapacity)) {
      throw new Error(`Total capacity calculation resulted in NaN. Final value: ${totalCapacity}`);
    }

    
    // Final capacity check
    if (totalCapacity < guestAmount) {
      throw new Error(
        `Not enough capacity. Booked capacity: ${totalCapacity}, Guests: ${guestAmount}`,
      );
    }


    // Creates new booking object
    const orderId = uuid.v4();
    const newBooking = {
      orderId,
      name,
      checkInDate,
      checkOutDate,

      guestAmount,

      totalPrice,
      rooms: bookingDetails.map((room) => ({
        type: room.type,
        amount: room.amount,
      })),
    };
   
    //  saving booking to data base
    await db.send(
      new PutCommand({
        TableName: orderTable,
        Item: newBooking,
      }),
    );

    // Updates room availability in database
    for (const update of roomUpdates) {
      await db.send(
        new UpdateCommand({
          TableName: roomTable,
          Key: { type: update.type },
          UpdateExpression: "SET #total = :newTotal",
          ExpressionAttributeNames: { "#total": "total" },
          ExpressionAttributeValues: { ":newTotal": update.newTotal },
        }),
      );
    }

    return apiResponse(200, { message: "Booking received successfully", orderId, ...newBooking });

  } catch (error) {
    console.error("Error processing booking:", error);
    return apiResponse(400, { error: error.message });
  }
};


