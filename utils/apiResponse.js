exports.apiResponse = (status, data = {}) => {
  return {
    statusCode: status,
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
