const {} = require("@aws-sdk/lib-dynamodb");
const db = require("../../services/db");
const uuid = require("uuid");
const { apiResponse } = require("../../utils/apiResponse");
const { getRoomData } = require("../../services/getRoomData");

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
  const data  = JSON.parse(event.body);
  const roomTable = process.env.RUM_TABLE;
  const { name, checkIn, checkOut, guestAmount, types } = data;

          if (Array.isArray(types)) {
            types.forEach((typeObj, index) => {
                const { type, roomAmount } = typeObj;
            });
        } else {
            console.error("Types is not an array");
            throw new Error("Invalid data format for types");
        }

      types.forEach((roomType, index) => {
      console.log(`Room Type ${index + 1}:`, roomType.type);
      console.log(`Room Amount ${index + 1}:`, roomType.roomAmount);
    });


  try {
    for (const room of rooms){
      if (
        !room.type ||
        !room.name ||
        !room.checkIn ||
        !room.checkOut ||
        !room.guestAmount ||
        typeof room.guestAmount === !Number ||
        !room.roomAmount ||
        typeof room.roomAmount === !Number
      ) {
        return apiResponse(400, { error: "Missing one or more required fields" });
      }
      const roomType = await getRoomData(room.type)
      if (!roomType) {
        return apiResponse(400, { error:'Invalid room type, '})
      }
    }

    // ---------------------------------------------------------------------------------

    function isValidBooking(guestCount, roomTypes) {
  let capacity = 0;
  for (const [type, count] of Object.entries(roomTypes)) {
    switch (type) {
      case 'single':
        capacity += count * 1;
        break;
      case 'double':
        capacity += count * 2;
        break;
      case 'suite':
        capacity += count * 3;
        break;
      default:
        return false;
    }
  }
  return capacity >= guestCount;
}


    // ----------------------------------------------------------------------------------
  
    // if (data.type !== 'enkelrum' && data.type !== 'dubbelrum' && data.type !== 'svit') {
    //   return
    // }
    
    const room = rooms.find((r) => r.type === roomType);

    if (!room || guests > room.max_guests) {
      return apiResponse(400, {
        success: false,
        message: "Invalid room type or too many guests",
      });
    }
    
    
  } catch (error) {}

  const putParams = {
    TableName: roomTable,
    Item: {
      Bookingsnumber: uuid.v4(),
      checkIn: checkIn,
      checkOut: checkOut,
      guestAmount: guestAmount,
      amountOfRooms: amountOfRooms,
      total_sum: total_sum,
      name: questName,
      /* createdAt: new Date().toISOString().split("T")[0].replace(/-/g, ""), */
    },
  };

  //   const params = {
  //     TableName: process.env.TABLE_NAME,
  //     Key: {
  //       id,
  //     },
  //   };
  // const result = await db.send(new GetCommand(params));
};
