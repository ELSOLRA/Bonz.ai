const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const db = require("./db");

exports.getRoomData = async (type) => {
  const params = {
    TableName: process.env.ROOM_TABLE,  
    Key: {
      type: type  
    }
  };

  try {
    const data = await db.send(new GetCommand(params));  
    return data.Item;  
  } catch (err) {
    console.error("Error fetching room data from DynamoDB:", err);
    throw new Error("Error fetching room data");
  }
};