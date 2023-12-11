const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing Authorization header" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid Authorization header format" });
  }
  const token = parts[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(verified.id).select("-password");
    if (!admin) {
      res.status(404);
      throw new Error("admin not found");
    }
    req.user = admin;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
module.exports = protect;
