const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const authenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({ message: "You are not authorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decoded.id).select("-password -__v");
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "You are not authorized", error: error.message });
  }
};

const requiredRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(401).json({ message: "You are not authorized" });
    }
    next();
  };
};

module.exports = { authenticated, requiredRole };
