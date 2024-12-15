import { handleError, CustomError } from './ErrorHandler.js';

const sendResponse = (res, status, data, message, error) => {
  res.status(status).json({ status, data, message, error });
};

const fetchRecords = async ({ model, query, filterParams, res, successMessage }) => {
  try {
    const { limit = 5, offset = 0, ...filters } = query;
    const filter = {};

    for (const param of filterParams) {
      if (filters[param]) {
        filter[param] = param === 'hidden' ? filters[param] === 'true' :
                       param === 'grammy' ? parseInt(filters[param], 10) :
                       filters[param];
      }
    }

    const records = await model.find(filter).skip(parseInt(offset, 10)).limit(parseInt(limit, 10));
    sendResponse(res, 200, records, successMessage, null);
  } catch (e) {
    handleError(e, res, model.modelName);
  }
};

const fetchRecordById = async ({ model, idField, id, res, successMessage, notFoundMessage }) => {
  try {
    const record = await model.findOne({ [idField]: id });
    if (record) {
      sendResponse(res, 200, record, successMessage, null);
    } else {
      throw new CustomError(404, notFoundMessage);
    }
  } catch (e) {
    handleError(e, res, model.modelName);
  }
};

const addNewRecord = async ({ model, data, res, successMessage }) => {
  try {
    const allowedFields = Object.keys(model.schema.paths);
    const invalidFields = Object.keys(data).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      throw new CustomError(400, 'Bad Request, Reason: Invalid fields.');
    }

    await model.create(data);
    sendResponse(res, 200, null, successMessage, null);
  } catch (e) {
    handleError(e, res, model.modelName);
  }
};

const updateRecord = async ({ model, idField, id, updates, res, notFoundMessage }) => {
  try {
    const allowedFields = Object.keys(model.schema.paths);
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      throw new CustomError(400, 'Bad Request, Reason: Invalid fields.');
    }

    const result = await model.updateOne({ [idField]: id }, { $set: updates }, { runValidators: true });

    if (result.matchedCount > 0) {
      res.status(204).send();
    } else {
      throw new CustomError(404, notFoundMessage);
    }
  } catch (e) {
    handleError(e, res, model.modelName);
  }
};

const deleteRecord = async ({ model, idField, id, res, notFoundMessage }) => {
  try {
    const record = await model.findOne({ [idField]: id });

    if (!record) {
      throw new CustomError(404, notFoundMessage);
    }

    const result = await model.deleteOne({ [idField]: id });

    if (result.deletedCount > 0) {
      sendResponse(res, 200, { [idField]: id }, `${model.modelName} ${record.name} deleted successfully.`, null);
    } else {
      throw new CustomError(404, `${model.modelName} not found.`);
    }
  } catch (e) {
    handleError(e, res, model.modelName);
  }
};

export default { fetchRecords, fetchRecordById, addNewRecord, updateRecord, deleteRecord };
