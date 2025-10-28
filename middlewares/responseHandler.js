"use strict";

module.exports = (req, res) => {
  const response = {};

  if (!res.body) {
    res.status(404).json({});
  }
};
