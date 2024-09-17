
const db = require("../../services/db.js");



exports.cancelOrder = async (event) => {
const {bookingNumber} = event.body


  const params = {
     TableName: "order",
    Key: {
        bookingnumber: `${bookingNumber}`,
    }
  };

  try {
    
   
  } catch (err) {
    
  }
};