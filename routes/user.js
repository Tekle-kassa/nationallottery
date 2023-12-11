const express = require("express");
const router = express.Router();

const {
  fetanLotto,
  selectTicket,
  registerUser,
  loginUser,
  logoutUser,
  sendOtp,
} = require("../controllers/user");

router.post("/fetan", fetanLotto);
router.post("/ticket", selectTicket);
router.post("/register", registerUser);
router.post("/sendOtp", sendOtp);
module.exports = router;
