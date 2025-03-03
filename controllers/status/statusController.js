const encryptPassword = require("../../helpers/encryptPassword");
const { fetchStatuses } = require("../../services/status/status-service");
const i18n = require("../../i18n/strings");
const { returnObject } = require("../../config/commonConfig");

const fetchStatus = async (req, res, next) => {
  try {
    const result = await fetchStatuses(req.body);

    res.status(200).json({
      ...returnObject,
      success: true,
      msg: "Data fetched successfully",
      data: result,
    });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        message: 'Internel server error',
        success: false,
      });
    }
  }
};

module.exports = { fetchStatus };
