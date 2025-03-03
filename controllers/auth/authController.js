const authModel = require("../../models/auth");

// ** Auth Controller ** //

exports.auth = async function (req, res) {
  return await authModel.auth(req, res);
};
exports.auth = async function (req, res) {
  return await authModel.verifyOTP(req, res);
};
