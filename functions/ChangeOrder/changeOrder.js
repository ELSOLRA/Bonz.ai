const db = require("../../services/db.js");
const { apiResponse } = require("../../utils/apiResponse.js");
// Följande detaljer kan ändras i en bokning men logiken för rummen ska följas om antalet gäster eller rum ändras:
// Antal gäster
// Vilka rumstyper och antal
// Datum för in-och utcheckning

exports.hander = async (event) => {
  const { orderId } = JSON.body(event.body);
};
