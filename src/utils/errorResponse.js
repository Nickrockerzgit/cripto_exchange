export const errorResponse = (res, message, status = 500) => {
  return res.status(status).json({
    success: false,
    message
  });
};