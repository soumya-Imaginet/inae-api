const { returnObject } = require("../../config/commonConfig");
const {
  getDashboardData,
} = require("../../services/dashboard/dashboard-services");

const dashboardData = async (req, res, next) => {
  try {
    const result = await getDashboardData(req.body);

    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

module.exports = { dashboardData };