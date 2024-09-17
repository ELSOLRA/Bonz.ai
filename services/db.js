const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// Initialize DynamoDB Client
const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

module.exports = { db, GetCommand, PutCommand, UpdateCommand, DeleteCommand };
