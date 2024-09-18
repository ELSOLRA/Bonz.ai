const { PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const db = require("../../services/db");
const uuid = require("uuid");
const { apiResponse } = require("../../utils/apiResponse");
const { getRoomData } = require("../../services/getRoomData");
const {
  parseCheckInDate,
  parseCheckOutDate,
  nightsBetweenDates,
} = require("../../services/timeService");

// Antal gäster (se nedan för affärslogik kring rum)
// Vilka rumstyper och antal (se nedan för affärslogik kring rum)
// Datum för in-och utcheckning
// Namn och e-postaddress på den som bokar
// Ett id på bokning (detta kan dock genereras på backend med exempelvis uuid eller nanoid )
// Affärslogik för rum

// Följande detaljer kan ändras i en bokning men logiken för rummen ska följas om antalet gäster eller rum ändras:

// Antal gäster
// Vilka rumstyper och antal
// Datum för in-och utcheckning

// Avbokningspolicy VG-krav

// En bokning kan avbokas senast två dagar in incheckningsdatum och kan enbart avbokas i sin helhet.

// "Bokningsnummer": "",
//     "incheck":"",
//     "utcheck":"",
//     "antal_gäster": 2,
//     "antal_rum": "",
//     "namn": ""

exports.handler = async (event) => {
  try {
    const { name, checkIn, checkOut, guestAmount, types } = JSON.parse(event.body);
    const roomTable = process.env.ROOM_TABLE;
    const orderTable = process.env.ORDER_TABLE;

    console.log("body object:--------------", name, checkIn, checkOut, guestAmount, types);

    let totalCapacity = 0;
    let totalPrice = 0;
    const bookingDetails = [];
    const roomUpdates = [];

    const checkInDate = parseCheckInDate(checkIn);
    console.log("checkInDate-------", checkInDate);

    const checkOutDate = parseCheckOutDate(checkOut);
    console.log("checkOutDate-------", checkOutDate);

    const nights = nightsBetweenDates(checkInDate, checkOutDate);
    console.log("nights spend:-----", nights);

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
      console.log(`Capacity increment for ${roomType.type}:`, capacityIncrement);
      totalCapacity += capacityIncrement;
      const roomTypePrice = roomData.price_per_night * roomType.roomAmount * nights;
      console.log("roomTypePrice------------------", roomTypePrice);
      console.log("nights------------------", nights);
      console.log("roomData.price_per_night---------", roomData.price_per_night);
      console.log("roomType.roomAmount---------", roomType.roomAmount);

      totalPrice += roomTypePrice;

      console.log("totalPrice------------------", totalPrice);

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
    if (totalCapacity < guestAmount) {
      throw new Error(
        `Not enough capacity. Booked capacity: ${totalCapacity}, Guests: ${guestAmount}`,
      );
    }
    const orderId = uuid.v4();
    const newBooking = {
      orderId,
      name,
      checkInDate,
      checkOutDate,
      // nights,
      guestAmount,
      // totalCapacity,
      totalPrice,
      rooms: bookingDetails.map((room) => ({
        type: room.type,
        amount: room.amount,
      })),
    };
    //     Bokningsnummer
    // Antalet gäster och rum
    // Total summa att betala
    // In-och utcheckningsdatum
    // Namn på gästen som bokat

    console.log("Before creating newBooking:");
    console.log("bookingId:", orderId);
    console.log("name:", name);
    console.log("checkIn:", checkIn);
    console.log("checkOut:", checkOut);
    console.log("nights:", nights);
    console.log("guestAmount:", guestAmount);
    console.log("totalCapacity:", totalCapacity);
    console.log("totalPrice:", totalPrice);
    console.log("bookingDetails:", JSON.stringify(bookingDetails));

    console.log("newBooking object:", JSON.stringify(newBooking, null, 2));

    await db.send(
      new PutCommand({
        TableName: orderTable,
        Item: newBooking,
      }),
    );

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
    // for (const room of rooms){
    //   if (
    //     !room.type ||
    //     !room.name ||
    //     !room.checkIn ||
    //     !room.checkOut ||
    //     !room.guestAmount ||
    //     typeof room.guestAmount === !Number ||
    //     !room.roomAmount ||
    //     typeof room.roomAmount === !Number
    //   ) {
    //     return apiResponse(400, { error: "Missing one or more required fields" });
    //   }
    //   const roomType = await getRoomData(room.type)
    //   if (!roomType) {
    //     return apiResponse(400, { error:'Invalid room type, '})
    //   }
    // }

    // ---------------------------------------------------------------------------------
  } catch (error) {
    console.error("Error processing booking:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ----------------------------------------------------------------------------------

// if (data.type !== 'enkelrum' && data.type !== 'dubbelrum' && data.type !== 'svit') {
//   return
// }

// const putParams = {
//   TableName: roomTable,
//   Item: {
//     Bookingsnumber: uuid.v4(),
//     checkIn: checkIn,
//     checkOut: checkOut,
//     guestAmount: guestAmount,
//     amountOfRooms: amountOfRooms,
//     total_sum: total_sum,
//     name: questName,
//     /* createdAt: new Date().toISOString().split("T")[0].replace(/-/g, ""), */
//   },
// };

//   const params = {
//     TableName: process.env.TABLE_NAME,
//     Key: {
//       id,
//     },
//   };
// const result = await db.send(new GetCommand(params));
// };
