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
  getSpecificLottery,
  forgotPassword,
  resetPassword,
  success,
  verifyOtp,
  guest,
} = require("../controllers/user");
router.get("/sendOtp", sendOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/forgotPassword", forgotPassword);
router.post("/verifyOtp", verifyOtp);
router.put("/resetPassword", resetPassword);
router.get("/getUser", protect, getUser);
router.post("/fetan", fetanLotto);
router.get("/lotteries", getLotteries);
router.get("/lottery/:id", getSpecificLottery);
router.get("/myLotteries", protect, getMyLotteries);
router.post("/ticket", selectTicket);
router.post("/guest", guest);
router.post("/deposit", protect, deposit);
router.post("/verify/:tx_ref", verify);
// router.get("/success", success);

router.post("/buy", protect, selectTicket);
module.exports = router;
