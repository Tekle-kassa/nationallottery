const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authUser");
const {
  fetanLotto,
  selectTicket,
  registerUser,
  loginUser,
  logoutUser,
  sendOtp,
  getUser,
  deposit,
  verify,
  getLotteries,
  getMyLotteries,
} = require("../controllers/user");
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/getUser", protect, getUser);
router.post("/fetan", fetanLotto);
router.get("/lotteries", getLotteries);
router.get("/myLotteries", protect, getMyLotteries);
router.post("/ticket", selectTicket);
router.post("/deposit", protect, deposit);
router.post("/verify/:tx_ref", protect, verify);
router.post("/sendOtp", sendOtp);
router.post("/buy", protect, selectTicket);
module.exports = router;
