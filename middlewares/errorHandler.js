// middlewares/errorHandler.js
export const notFound = (req, _res, next) => {
  const err = new Error(`No se encontró ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const payload = {
    message: err.message || "Error interno del servidor",
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.path = req.originalUrl;
    payload.method = req.method;
    payload.body = req.body;
    payload.stack = err.stack;
  }
  console.error("[ERROR]", status, payload.message, req.originalUrl);
  res.status(status).json(payload);
};
