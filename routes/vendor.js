const express = require("express");

const router = express.Router();
const isVendorActive = require("../middlewares/isVendorActive");
const protect = require("../middlewares/authVendor");

const {
  sellTicket,
  loginVendor,
  logoutVendor,
  resetPassword,
  soldTickets,
} = require("../controllers/vendor");
router.post("/login", loginVendor);
router.get("/logout", logoutVendor);
router.put("/resetPassword", resetPassword);
router.post("/sellTicket", protect, isVendorActive, sellTicket);
router.get("/soldTickets", protect, soldTickets);

module.exports = router;
