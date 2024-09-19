const validateOrder = (name, checkIn, checkOut, guestAmount, types) => {
  const dateRegex = /^\d{8}$/;
  if (
    (typeof name !== "string" ||
      !dateRegex.test(checkIn) ||
      !dateRegex.test(checkOut) ||
      typeof guestAmount !== "number",
    !Array.isArray(types)) ||
    types.some((type) => typeof type.type !== "string" || typeof type.roomAmount !== "number")
  ) {
    throw new Error("Input validation error");
  }
};
/*
  for (const room of rooms){
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
};

const validateUpdate = (guestAmount, rooms, checkInDate, checkOutDate) => {};

*/
/* 
function validate_date(checkIn, checkOut) {
  let dateInput = checkIn;
  let dateInpu = checkOut;

  let dateObj = new Date(dateInput);
  let dateOb = new Date(dateInpu);

  function isDateValid(dateStr) {
    return !isNaN(new Date(dateStr));
  }

  let dateArray = new Array(2);
  let isValid = new Array(2);
  dateArray.push(dateObj);
  dateArray.push(dateOb);
  for (let i = 0; i < dateArray.length; i++) {
    let output = isDateValid(dateInput[i]);
    if (!output) {
      return apiResponse(400, { Message: "Date is not a valid date." });
    } else {
      isValid.push(0);
      return isValid;
    }
  }
  if (isValid.length == 2) {
    return 0;
  }
} */
