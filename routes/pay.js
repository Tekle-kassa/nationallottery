const express = require("express");
const {
  payLottery,
  customerBalance,
  addBalance,
} = require("../controllers/pay");
const router = express.Router();

router.post("/pay", payLottery);
router.post("/customerBalance", customerBalance);
router.post("/addBalance", addBalance);
module.exports = router;
