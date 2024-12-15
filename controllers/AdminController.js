import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { handleError, CustomError } from '../utils/ErrorHandler.js';

const sendResponse = (res, status, data, message, error) => {
  res.status(status).json({ status, data, message, error });
};

const getAllUsers = async (req, res) => {
  try {
    const { limit = 5, offset = 0, role } = req.query;
    if (!role || ['Editor', 'Viewer'].includes(role)) {
      const filter = role ? { role } : { role: { $ne: 'Admin' } };
      const users = await User.find(filter).skip(offset).limit(limit);
      sendResponse(res, 200, users, 'Users retrieved successfully.', null);
    } else {
      throw new CustomError(400, 'Bad Request.');
    }
  } catch (e) {
    handleError(e, res, 'User');
  }
};

const addUser = async (req, res) => {
  try {
    const { email, password, role = 'Viewer' } = req.body;
    if (role === 'Admin') {
      throw new CustomError(400, 'Bad Request, Reason: role.');
    }
    if (!password) {
      throw new CustomError(400, 'Bad Request, Reason: password.');
    }
    const userCount = await User.countDocuments();
    const effectiveRole = userCount === 0 ? 'Admin' : role;
    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.create({ email, password: hashedPassword, role: effectiveRole });
    sendResponse(res, 200, null, 'User created successfully.', null);
  } catch (e) {
    handleError(e, res, 'User');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const result = await User.deleteOne({ user_id: id });
      if (result.deletedCount > 0) {
        sendResponse(res, 200, null, 'User deleted successfully.', null);
      } else {
        throw new CustomError(404, 'User not found.');
      }
    } else {
      throw new CustomError(400, 'Bad Request.');
    }
  } catch (e) {
    handleError(e, res, 'User');
  }
};

export default { getAllUsers, addUser, deleteUser };
