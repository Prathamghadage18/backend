export const notFoundError = (message, res) => {
  res.status(404);
  throw new Error(message);
};

export const validationError = (message, res) => {
  res.status(400);
  throw new Error(message);
};

export const unauthorizedError = (message, res) => {
  res.status(401);
  throw new Error(message);
};

export const generateRandomString = (length) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
