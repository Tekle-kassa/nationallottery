const express = require("express");
const router = express.Router();

const {
  addLotteryInfo,
  getLotteries,
  getVendors,
  activateVendor,
  suspendVendor,
  registerVendor,
} = require("../controllers/admin");

router.post("/addLottery", addLotteryInfo);
router.get("/lotteries", getLotteries);
router.post("/addVendor", registerVendor);
router.get("/vendors", getVendors);
router.put("/activateVendor", activateVendor);
router.put("/suspendVendor", suspendVendor);

module.exports = router;
