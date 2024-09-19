const db = require("../../services/db.js");
const { getRoomData } = require("../../services/getRoomData.js");
const {
  nightsBetweenDates,
  parseCheckInDate,
  parseCheckOutDate,
} = require("../../services/timeService.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { validateUpdate } = require("../../services/validateData")
// Följande detaljer kan ändras i en bokning men logiken för rummen ska följas om antalet gäster eller rum ändras:
// Antal gäster
// Vilka rumstyper och antal
// Datum för in-och utcheckning

exports.handler = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const roomTable = process.env.ROOM_TABLE;
  const { orderId } = event.pathParameters;
  const { guestAmount, rooms, checkInDate, checkOutDate } = JSON.parse(event.body);


  try {

    validateUpdate(guestAmount, rooms, checkInDate, checkOutDate)
    
    const params = {
      TableName: orderTable,
      Key: {
        orderId,
      },
    };

    const order = await db.send(new GetCommand(params));

    if (!order.Item) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const roomsInOrder = order.Item.rooms;

    let updatedRooms = roomsInOrder.map((existingRoom) => {
      const updatedRoom = rooms.find((r) => r.type === existingRoom.type);
      if (updatedRoom) {
        return { ...existingRoom, amount: updatedRoom.amount };
      }
      return existingRoom;
    });

    rooms.forEach((newRoom) => {
      if (!updatedRooms.some((r) => r.type === newRoom.type)) {
        updatedRooms.push(newRoom);
      }
    });

    const removedRooms = roomsInOrder.filter(
      (existingRoom) => !rooms.some((r) => r.type === existingRoom.type && r.amount > 0),
    );

    // const roomsFound = roomsInOrder.filter((r) => r.type !== rooms.type);
    // console.log("roomsFound--------:", roomsFound);

    updatedRooms = updatedRooms.filter((room) => room.amount > 0);

    const nights = nightsBetweenDates(
      parseCheckInDate(checkInDate),
      parseCheckOutDate(checkOutDate),
    );

    let totalCapacity = 0;
    let totalPrice = 0;
    // const bookingDetails = [];
    const roomUpdates = [];

    for (const room of updatedRooms) {
      const roomData = await getRoomData(room.type);

      if (!roomData || !room.amount) {
        throw new Error(`Invalid room type - ${room.type}, or no amount provided`);
      }
      const capacityCount = roomData.max_guests * room.amount;
      totalCapacity += capacityCount;

      const roomTypePrice = roomData.price_per_night * room.amount * nights;
      totalPrice += roomTypePrice;

      const orderRoomAmount = roomsInOrder.find((r) => r.type === room.type)?.amount || 0;
      const roomAmountDiff = room.amount - orderRoomAmount;

      if (roomAmountDiff !== 0) {
        const changedTotal = roomData.total - roomAmountDiff;

        if (changedTotal < 0) {
          throw new Error(
            `Not enough ${room.type} available. Requested more: ${roomAmountDiff}, Available: ${roomData.total}`,
          );
        }

        /*       bookingDetails.push({
          type: room.type,
          amount: room.amount,
          pricePerNight: roomData.price_per_night,
          totalPrice: roomTypePrice,
        }); */

        roomUpdates.push({
          type: room.type,
          newTotal: changedTotal,
        });
      }
    }

    for (const removedRoom of removedRooms) {
      const roomData = await getRoomData(removedRoom.type);

      if (!roomData) {
        throw new Error(`${removedRoom.type} - no such type of room in database`);
      }

      const increaseTotal = roomData.total + removedRoom.amount;

      roomUpdates.push({
        type: removedRoom.type,
        newTotal: increaseTotal,
      });
    }
    /*     const removedRoomTypes = existingRooms.filter(
      (r) => !rooms.find((room) => room.type === r.type),
    );
    for (const room of removedRoomTypes) {
      const roomData = await getRoomData(room.type);
      const roomAmountDiff = -room.roomAmount; // Negative difference for removed rooms

      const changedTotal = roomData.total - roomAmountDiff; // Increase availability
      roomUpdates.push({
        type: room.type,
        newTotal: changedTotal,
      });
    } */ /* Solution GPT  */

    /*     for (const room of roomsFound) {
      const roomData = await getRoomData(room.type);
      const capacityCount = roomData.max_guests * room.amount;
      totalCapacity += capacityCount;

      const roomTypePrice = roomData.price_per_night * room.amount * nights;
      totalPrice += roomTypePrice;
    } */ /* old case */

    // totalCapacity = totalCapacityOldOrder + totalPriceUpdateChanges;

    if (totalCapacity < guestAmount) {
      throw new Error(
        `Not enough capacity. Booked capacity: ${totalCapacity}, Guests: ${guestAmount}`,
      );
    }

    // const updatedRooms = [...roomsFound, ...rooms];

    const updateParams = {
      TableName: orderTable,
      Key: { orderId },
      UpdateExpression:
        "SET guestAmount = :guestAmount, checkInDate = :checkInDate, checkOutDate = :checkOutDate, rooms =:rooms, totalPrice = :totalPrice ",
      // ExpressionAttributeName:,
      ExpressionAttributeValues: {
        ":guestAmount": guestAmount,
        ":checkInDate": parseCheckInDate(checkInDate),
        ":checkOutDate": parseCheckOutDate(checkOutDate),
        ":rooms": updatedRooms,
        ":totalPrice": totalPrice,
      },
      ReturnValues: "ALL_NEW",
    };

    /* const updatedOrder = */ await db.send(new UpdateCommand(updateParams));

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
    /*
    for (const [type, existingAmount] of existingRoomTypes) {
  if (!updatedRoomTypes.has(type)) {  // Checks if the room type exists in the old order but not in the updated one
    const roomData = await getRoomData(type);
    if (!roomData) {
      throw new Error(`Room data not found for type: ${type}`);
    }

    const difference = -existingAmount;  // Set difference to negative, meaning rooms are "returned"
    roomUpdates.push({
      type,
      newTotal: roomData.total - difference,  // Updates the room total
      difference 
    });
  }
}
*/
    return apiResponse(200, {
      message: "Order updated successfully",
      orderId,
      // ...updatedOrder.Attributes,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return apiResponse(400, { error: error.message });
  }
};