const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const download = require("image-downloader");
const request = require("request");
const fs = require("fs");
const moment = require("moment-timezone");
const { Server } = require("socket.io");
const http = require("http");

// LOAD CONFIG FIRST
const result = dotenv.config({ path: path.join(__dirname, ".env") });
if (result.error) {
  throw result.error;
}

const { errorHandler } = require("./middlewares");
const morganMiddleware = require("./middlewares/morganMiddleware");
const logger = require("./lib/logger");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("port", process.env.SERVER_PORT || 4030);
app.set("views", __dirname + "/views");
app.set("view engine", "hbs");
app.use(express.static("public"));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(express.text({ type: "text/html" }));
app.use(cors());
app.use(morganMiddleware);
app.use(errorHandler);

// Serve React app in production
app.use(express.static(path.join(__dirname, "client/dist")));

app.get("/", (req, res) => {
  res.render("home");
});

// Serve React app for /card-reader route
app.get("/card-reader", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

app.post("/temp/cardread", async (req, res) => {
  res.set("Content-Type", "text/html");
  const fullData = req.body;
  logger.warn(fullData);
  if (
    !fullData ||
    (!fullData instanceof String && !typeof val === "string") ||
    fullData.indexOf("vgdecoderesult=") < 0 ||
    fullData.indexOf("&&devicenumber") < 0
  ) {
    return res.send(Buffer.from("code=1111"));
  }
  const readData = fullData.substring(
    fullData.indexOf("vgdecoderesult=") + 15,
    fullData.indexOf("&&devicenumber")
  );

  if (!readData) {
    return res.send(Buffer.from("code=1111"));
  }

  // Send Socket here
  io.emit("cardData", { cardData: readData });

  return res.send(Buffer.from("code=0000"));
});

// Socket.IO server on port 4014
const socketServer = httpServer.listen(4014, () => {
  logger.debug(`Socket.IO server is running on port 4014`);
});

// Main Express app
app.listen(app.get("port"), () => {
  logger.debug(`App is running at http://localhost:${app.get("port")}`);
  logger.debug("Press CTRL-C to stop\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.debug("SIGTERM signal received: closing HTTP servers");
  socketServer.close(() => {
    logger.debug("Socket.IO server closed");
  });
  io.close(() => {
    logger.debug("Socket.IO connections closed");
  });
});

process.on("SIGINT", () => {
  logger.debug("SIGINT signal received: closing HTTP servers");
  socketServer.close(() => {
    logger.debug("Socket.IO server closed");
  });
  io.close(() => {
    logger.debug("Socket.IO connections closed");
    process.exit(0);
  });
});
