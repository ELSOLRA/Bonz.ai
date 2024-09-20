# Bonz.ai

Group-examination

![Serverless_4.4.0](https://img.shields.io/badge/Serverless_4.4.0-red)

A serverless hotel room booking API built with the Serverless Framework, AWS Lambda, API Gateway, and DynamoDB.

## Features

- Load room data into DynamoDB
- Book one or multiple rooms
- Modify existing bookings
- Retrieve booking details
- List all bookings
- Cancel bookings

## Project Structure

The project is organized as follows:

- **`/data`**: Contains data in json format
- **`/functions`**: Contains all function folders with functions
- **`/services`**: Contains the dynamodb client
- **`/utils`**: Contains utility functions and helper modules.
- **`serverless.yml`**: Contains serverless configuration details

## Dependencies

List of main dependencies used in the project:

- aws-sdk/client-dynamodb: 3.651.1
- aws-sdk/lib-dynamodb: 3.651.1
- uuid: 10.0.0
- serverless-scriptable-plugin: 1.3.1

## API Endpoints

- POST /book: Create a new booking
- POST /orders/{orderId}: Modify a booking
- GET /orders: List all bookings
- GET /orders/{orderId}: Retrieve a specific booking
- DELETE /cancel: Cancel a booking

## Contributing

Contributions to the Bonz.ai API project are welcome!
