class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.isOperational = true; // Flag for identifying operational errors
  }
}

module.exports = AppError;
