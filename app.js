const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const dataBaseConnect = require("./database/db.js");
const ErrorHandler = require("./middlewares/error.js");
const appRoutes = require("./routes/index");
const cors = require("cors");
const bodyParser = require("body-parser");

// ! Create app
const app = express();

// ! App configs
dotenv.config();
// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("Server error: " + err.message);
  process.exit(1);
});

// ! import middleware app

app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/v1/order/stripe/webhook")) {
    bodyParser.raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
// ! starting the DataBase
dataBaseConnect();

// ! Error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  } else {
    next();
  }
});

// ! import Routes
app.use("/api/v1", appRoutes);
// Starting message
app.get("/", (req, res) => {
  return res.status(200).send("Welcome to NodeJs E-commerce Backend");
});
// ! Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./doc/swagger.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ! Starting Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is starting on http://localhost:${PORT}`);
});

// unhandled promise rejection
app.use(ErrorHandler);
process.on("unhandledRejection", (reason) => {
  console.log("Server closed duce to" + reason);
  server.close(() => {
    process.exit(1);
  });
});
