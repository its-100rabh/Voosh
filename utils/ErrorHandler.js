export class CustomError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.type = 'custom';
  }
}

const sendResponse = (res, status, data, message, error) => {
  res.status(status).json({ status, data, message, error });
};

export const handleError = (e, res, object) => {
  console.error(e);
  let { status, message } = { status: 500, message: 'Internal server error.' };

  if (e.name === 'ValidationError') {
    const msg = Object.values(e.errors).map(err => err.message).join(', ');
    if (msg === 'NotFound') {
      status = 404;
      message = 'Resource Doesn\'t exist.';
    } else {
      const errors = Object.values(e.errors).map(err => err.message);
      status = 400;
      message = `${errors.join(', ')}`;
    }
  } else if (e.code === 11000) {
    status = 409;
    message = `${object} already exists.`;
  } else if (e.type === 'custom') {
    status = e.status;
    message = e.message;
  }

  sendResponse(res, status, null, message, null);
};