const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY;

module.exports = {
  msToTime: (duration) => {
    let minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return hours + ":" + minutes;
  },
  generateHash: (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  },
  validPassword: (password, hash) => {
    return bcrypt.compareSync(password, hash);
  },
  authToken: (user) => {
    const accessToken = jwt.sign({ user: user }, secretKey, {
      expiresIn: "9999 years",
    });
    const refreshToken = jwt.sign({ username: user.username }, secretKey, {
      expiresIn: "9999 years",
    });
    return { accessToken, refreshToken };
  },
  verifyToken: (req, res, next) => {
    try {
      const { user } = jwt.verify(req.headers.token, secretKey);
      req.auth = {
        user: user,
      };
      next();
    } catch (err) {
      if (err.name == "TokenExpiredError") {
        return res.status(401).json({
          message: "Access token expired! Please renew your token.",
          code: 401,
        }); // No token present
      }
      return res.status(401).json({
        message: "Invalid access token",
      });
    }
  },
  verifyPublicToken: (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

      if (token == null || token !== process.env.API_TOKEN)
        return res.status(401).json({ message: "Invalid token" }); // No token present
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" }); // No token present
    }
  },
  escapeXml: (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
      }
    });
  },
};
