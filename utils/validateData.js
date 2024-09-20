
//both functions to check correct format in body

const validateOrder = (name, checkIn, checkOut, guestAmount, types) => {
  const dateRegex = /^\d{8}$/;
  if (
    (typeof name !== "string" || 
      !dateRegex.test(checkIn) ||
      !dateRegex.test(checkOut) ||
      typeof guestAmount !== "number" ||
    !Array.isArray(types)) ||
    types.some((type) => typeof type.type !== "string" || typeof type.roomAmount !== "number")
  ) {
    throw new Error("Input validation error");
  }
};

const validateUpdate = (guestAmount, rooms, checkInDate, checkOutDate) => {
  const dateRegex = /^\d{8}$/;
  if (
    typeof guestAmount !== "number" ||
    !Array.isArray(rooms) ||
    !dateRegex.test(checkInDate) ||
    !dateRegex.test(checkOutDate) ||
    rooms.some((room) => typeof room.type !== "string" || typeof room.amount !== "number")
  ) {
    throw new Error("Input validation error");
  }
};


module.exports = { validateOrder, validateUpdate };