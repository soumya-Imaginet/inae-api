const { returnObject } = require("../../config/commonConfig");
const {
  sendQueryToAdmin,
  fetchQueries,
  updateQueryService,
} = require("../../services/miscellaneous/miscellaneous-service");
const path = require("path");
const fs = require("fs");
const queryDB = require("../../config/queryDb");

const querySendToAdmin = async (req, res, next) => {
  try {
    const result = await sendQueryToAdmin(req.body);

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
const getAllQueries = async (req, res) => {
  try {
    const result = await fetchQueries(req.query);

    if (result.success) {
      res.status(result.status).json({
        success: result.success,
        message: result.message,
        data: result.data,
        totalCount: result.totalCount,
      });
    } else {
      res.status(result.status).json({
        success: result.success,
        message: result.message,
        data: result.data,
        totalCount: result.totalCount,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};
const updateQuery = async (req, res) => {
  console.log("ressss", req.params);
  try {
    const { id } = req.params; // Extract ID from URL
    const { resolved } = req.body; // Extract data from request body
    console.log("fff", id, resolved);
    if (!id || resolved === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: ID, userId, query, and resolved status are required.",
      });
    }

    const result = await updateQueryService(id, resolved);

    res.status(result.status).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { name, userId, type } = req.body;
    if (!name) {
      return res.status(400).json({ message: "File name is required" });
    }

    // Define the file path
    const filePath = path.resolve(process.cwd(), "uploads", "documents", name);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      if (type === "profile") {
        const removeImageFromUserDb = `UPDATE user SET profile_img=NULL WHERE id=?`;
        await queryDB(removeImageFromUserDb, [userId]);
      }

      return res.status(200).json({
        success: true,
        message: "picture deleted successfully",
        data: [],
      });
    } else {
      return res.status(404).json({ message: "File not found" });
    }
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { querySendToAdmin, getAllQueries, updateQuery, deleteImage };
