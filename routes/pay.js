const express = require("express");
const protect = require("../middlewares/authUser");
const {
  payLottery,
  customerBalance,
  addBalance,
  verify,
} = require("../controllers/pay");
const { deposit } = require("../controllers/user");

const router = express.Router();

router.post("/pay", payLottery);
router.post("/deposit", protect, deposit);
router.post("/verify", protect, verify);
router.post("/customerBalance", protect, customerBalance);
router.post("/addBalance", addBalance);
module.exports = router;
