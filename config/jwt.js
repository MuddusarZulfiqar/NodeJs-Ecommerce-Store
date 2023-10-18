const jwt = require("jsonwebtoken");

const generateToken = (id, expire) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expire || process.env.JWT_EXPIRE,
  });
};

const validateToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, validateToken };
