"use strict";

module.exports = (err, req, res, next) => {
  if (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
