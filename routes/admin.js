const express = require("express");
const router = express.Router();
const protect = require("../middlewares/isAdmin");

const {
  addLotteryInfo,
  getLotteries,
  getVendors,
  activateVendor,
  suspendVendor,
  registerVendor,
  searchVendor,
  getLotteryById,
} = require("../controllers/admin");

router.post("/addLottery", addLotteryInfo);
router.get("/search", searchVendor);
router.get("/lotteries", getLotteries);
router.post("/lottery", getLotteryById);
router.put("/updateLottery/:id");
router.post("/addVendor", registerVendor);
router.get("/vendors", getVendors);
router.put("/activateVendor", activateVendor);
router.put("/suspendVendor", suspendVendor);

module.exports = router;
