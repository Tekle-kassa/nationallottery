const Vendor = require("../models/vendor");

module.exports = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res.status(404).json({ message: "vendor not found" });
    }
    if (vendor.status === "active") {
      next();
    } else {
      return res.status(403).json({ message: "Vendor is not active" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
