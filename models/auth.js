const { returnObject, statusCodes } = require("../config/commonConfig");
const { validationResult } = require("express-validator");
const i18n = require("../i18n/strings");

async function auth(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      returnObject.code = statusCodes.bad_request;
      returnObject.message = i18n.t("validationFailed");

      return res.status(statusCodes.bad_request).json(returnObject);
    }
  } catch (error) {
    returnObject.code = statusCodes.internal_server_error;
    returnObject.message = i18n.t("serverErrorMsg");
    console.log(error);

    return res.status(statusCodes.internal_server_error).json(returnObject);
  }
  returnObject.code = statusCodes.success;
  returnObject.message = i18n.t("successMessage");
  returnObject.success = true;
  return res.status(200).json(returnObject);
}

async function verifyOTP(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      returnObject.code = statusCodes.bad_request;
      returnObject.message = i18n.t("validationFailed");

      return res.status(statusCodes.bad_request).json(returnObject);
    }
  } catch (error) {
    returnObject.code = statusCodes.internal_server_error;
    returnObject.message = i18n.t("serverErrorMsg");
    console.log(error);

    return res.status(statusCodes.internal_server_error).json(returnObject);
  }
  returnObject.code = statusCodes.success;
  returnObject.message = i18n.t("successMessage");
  returnObject.success = true;
  return res.status(200).json(returnObject);
}

module.exports = {
  auth, verifyOTP
};
