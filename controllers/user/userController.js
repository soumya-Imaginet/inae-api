const { encryptPassword } = require("../../helpers/encryptPassword");
const {
  createNewUser,
  verifyOTP,
  sendOTP,
  userLogin,
  resetPassword,
  getUsersList,
  fetchUserById,
  UpdateUserById,
  getTotalCommitteeMembers,
} = require("../../services/user/user-service");
const { returnObject, statusCodes } = require("../../config/commonConfig");

const createUser = async (req, res, next) => {
  try {
    req.body.hashedPassword = await encryptPassword(req.body.password);
    const result = await createNewUser(req.body);
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
const updateUser = async (req, res, next) => {


  try {
    const result = await UpdateUserById(req);
   
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
const checkUserOTP = async (req, res, next) => {
  try {
    const result = await verifyOTP(req.body);
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

const sendUserOTP = async (req, res, next) => {
  try {
    const result = await sendOTP(req.body);
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

const loginUser = async (req, res, next) => {
  try {
    const result = await userLogin(req.body);
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
const userPasswordReset = async (req, res, next) => {
  try {
    console.log("requ body", req.body);
    req.body.hashedPassword = await encryptPassword(req.body.password);
    const result = await resetPassword(req.body);
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

const userAdd = async (req, res, next) => {
  try {
    req.body.hashedPassword = await encryptPassword(req.body.password);
    req.body.innerUser = true;

    const result = await createNewUser(req.body);
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

const getUsers = async (req, res, next) => {
  try {
    const result = await getUsersList(req.query);
    
    if (result.success) {
      console.log("resss",result)
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
       
        totalCount: result?.rowCount,
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

const getUserById = async (req, res, next) => {
  try {
    const result = await fetchUserById(req.query);

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
const getTotalCommitteeMemberCount = async (req, res, next) => {
  try {
    const result = await getTotalCommitteeMembers(req.query);

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

module.exports = {
  createUser,
  checkUserOTP,
  sendUserOTP,
  loginUser,
  userPasswordReset,
  userAdd,
  getUsers,
  getUserById,
  updateUser,
  getTotalCommitteeMemberCount,
};
