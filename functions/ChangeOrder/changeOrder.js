const db = require("../../services/db.js");
const { apiResponse } = require("../../utils/apiResponse.js");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
// Följande detaljer kan ändras i en bokning men logiken för rummen ska följas om antalet gäster eller rum ändras:
// Antal gäster
// Vilka rumstyper och antal
// Datum för in-och utcheckning

exports.hander = async (event) => {
  const orderTable = process.env.ORDER_TABLE;
  const roomTable = process.env.ROOM_TABLE;
  const { orderId } = event.pathParameters;
  const { guestAmount, rooms, checkInDate, checkOutDate } = JSON.body(event.body);

  try {
    const params = {
      TableName: orderTable,
      Key: {
        orderId,
      },
    };

    const order = await db.send(new GetCommand(params));

    const guestAmountChanged = order.Item.guestAmount !== guestAmount;

    const updateParams = {
      TableName: orderTable,
      Key: { orderId },
      UpdateExpression:
        "SET guestAmount = :guestAmount, rooms =:rooms,  checkInDate = :checkInDate, checkOutDate = :checkOutDate, totalPrice = :totalPrice ",
      // ExpressionAttributeName:,
      ExpressionAttributeValues: {
        ":guestAmount": guestAmount,
        ":rooms": rooms,
        ":checkInDate": checkInDate,
        ":checkOutDate": checkOutDate,
      },
      ReturnValue: "ALL_NEW",
    };

    const result = await db.send(new UpdateCommand(updateParams));
  } catch (error) {}
};
