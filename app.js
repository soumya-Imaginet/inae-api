require("dotenv").config();
require("./views/cronjobs/cronjobs");
const express = require("express");
const path = require("path");
const i18n = require("./i18n/strings");

const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// Import routes
const authRouter = require("./routes/auth/authRoutes");
const userRouter = require("./routes/user/userRoutes");
const statusRouter = require("./routes/status/statusRouter");
const membershipRouter = require("./routes/forms/membershipRouter");
const miscellaneousRouter = require("./routes/miscellaneous/miscellaneousRouter");
const dashboardRouter = require("./routes/dashboard/dashboardRouter");

// Use routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/status", statusRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/forms", membershipRouter);
app.use("/api/v1/miscellaneous", miscellaneousRouter);
app.use("/api/v1/testing", (req, res) => {
  res.json({ message: "Testing route is working!" });
});

const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

module.exports = app;
