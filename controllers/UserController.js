import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { handleError, CustomError } from '../utils/ErrorHandler.js';

const sendResponse = (res, status, data, message, error) => {
  res.status(status).json({ status, data, message, error });
};

const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!password) {
      throw new CustomError(400, 'Bad Request, Reason: password.');
    }
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'Admin' : 'Viewer';
    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.create({ email, password: hashedPassword, role });
    sendResponse(res, 200, null, 'User created successfully.', null);
  } catch (e) {
    handleError(e, res, 'User');
  }
};

const login = (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign(
      { id: user.user_id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    sendResponse(res, 200, { token }, 'Login successful.', null);
  } catch (e) {
    handleError(e, res, 'User');
  }
};

const logout = (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      sendResponse(res, 200, null, 'User logged out successfully.', null);
    } else {
      throw new CustomError(400, 'Bad Request.');
    }
  } catch (e) {
    handleError(e, res, 'User');
  }
};

const updatePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const user = await User.findOne({ user_id: req.user.id });
    if (!user) {
      throw new CustomError(404, 'User not found.');
    }
    const isPasswordValid = await bcrypt.compare(old_password, user.password);
    if (!isPasswordValid) {
      throw new CustomError(400, 'Bad Request, Reason: Invalid credentials.');
    }
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    const result = await User.updateOne(
      { user_id: user.user_id }, 
      { $set: { password: hashedPassword } }
    );
    if (result.modifiedCount > 0) {
      res.status(204).send();
    } else {
      throw new CustomError(404, 'User not found.');
    }
  } catch (e) {
    handleError(e, res, 'User');
  }
};

export default { signup, login, logout, updatePassword };
