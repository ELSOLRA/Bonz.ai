const {} = require("@aws-sdk/lib-dynamodb");
const db = require("../../services/db");
const uuid = require("uuid");
const { apiResponse } = require("../../utils/apiResponse");

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
  const { roomId, name, checkIn, checkOut, guestAmount, roomAmount } = JSON.parse(event.body);
  const roomTable = process.env.RUM_TABLE;
  try {
    if (
      !roomId ||
      !name ||
      !checkIn ||
      !checkOut ||
      !guestAmount ||
      typeof guestAmount === !Number ||
      !roomAmount ||
      typeof roomAmount === !Number
    ) {
      return apiResponse(400, { error: "Missing one or more required field" });
    }
    if (checkIn.toISOString().split("T")[0].replace(/-/g, "")) {
      //Do nothing if correct.
    } else {
      return apiResponse(400, { error: "Checkin date is wrong format, follow YYYYMMDD format" });
    }
  } catch (error) {}

  const putParams = {
    TableName: roomTable,
    Item: {
      Bookingsnumber: uuid.v4(),
      checkIn: checkIn,
      checkOut: checkOut,
      guestAmount: guestAmount,
      roomAmount: roomAmount,
      createdAt: new Date().toISOString().split("T")[0].replace(/-/g, ""),
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
