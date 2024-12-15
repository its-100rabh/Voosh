import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { handleError } from '../utils/ErrorHandler.js';

const sendResponse = (res, status, data, message, error) => {
  res.status(status).json({ status, data, message, error });
};

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return sendResponse(res, 401, null, 'Unauthorized Access.', null);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    sendResponse(res, 401, null, 'Unauthorized Access.', null);
  }
};

export const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendResponse(res, 403, null, 'Forbidden Access/Operation not allowed.', null);
  }
  next();
};

export const validateCredentials = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendResponse(
      res,
      400,
      null,
      `Bad Request, Reason: Missing ${!email ? 'email' : 'password'}.`,
      null
    );
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, null, 'User not found.', null);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendResponse(res, 400, null, 'Bad Request, Invalid credentials.', null);
    }

    req.user = user;
    next();
  } catch (error) {
    handleError(error, res);
  }
};
