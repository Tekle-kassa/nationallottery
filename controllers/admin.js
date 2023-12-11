const Admin = require("../models/admin");
const Lottery = require("../models/lottery");
const Prize = require("../models/prize");
const Vendor = require("../models/vendor");
const phoneNumberFormatter = require("../middlewares/phoneNumberFormatter");

module.exports.addLotteryInfo = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      drawDate,
      prize,
      price,
      rule,
      digit,
    } = req.body;

    const lottery = await Lottery.findOne({ name });
    if (!Object.values(Lottery.schema.path("name").enumValues).includes(name)) {
      return res.status(400).json({ message: "Invalid lottery name!" });
    }
    if (lottery && lottery.drawDate) {
      return res.status(400).json({ message: "this lottery already exists!" });
    }
    const newLottery = new Lottery({
      name,
      description,
      startDate,
      drawDate,
      price,
      rule,
      digit,
    });

    const saveLottery = await newLottery.save();
    const newPrize = new Prize({
      prize,
      lottery: saveLottery._id,
    });
    const savePrize = await newPrize.save();

    saveLottery.prize = savePrize._id;
    await saveLottery.save();
    res.status(201).json(saveLottery);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.getLotteries = async (req, res) => {
  try {
    const lotteries = await Lottery.find().populate("prize");
    if (lotteries) {
      res.json({ lotteries });
    }
  } catch (error) {
    // console.log(error);
    return res.status(404).json("no records");
  }
};
module.exports.registerVendor = async (req, res) => {
  try {
    const { name, phoneNumber, password } = req.body;

    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ error: "please fill all the fields" });
    }
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    const vendorExists = await Vendor.findOne({
      phoneNumber: formatedPhoneNumber,
    });
    if (vendorExists) {
      return res
        .status(400)
        .json({ message: "phone number has already been used" });
    }
    const vendor = new Vendor({
      name,
      phoneNumber: formatedPhoneNumber,
      password,
    });
    await vendor.save();
    res.status(201).json({
      _id: vendor._id,
      phoneNumber: formatedPhoneNumber,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    if (vendors) {
      res.json({ vendors });
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json("no records");
  }
};
module.exports.searchVendor = async (req, res) => {
  try {
    const { query } = req.query;
    const regexQuery = new RegExp(query, "i");

    const vendor = await Vendor.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: regexQuery } },
            { phoneNumber: { $regex: regexQuery } },
          ],
        },
      },
    ]);
    // const query = {};
    // if (name) {
    //   query.name = name;
    // }
    // if (phoneNumber) {
    //   query.phoneNumber = phoneNumber;
    // }
    console.log(vendor);
    res.status(200).json({ vendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.activateVendor = async (req, res) => {
  try {
    const { id } = req.body;
    const vendor = await Vendor.findOne({ _id: id });
    if (!vendor) {
      return res.status(404).json({ message: "vendor not found" });
    }
    vendor.status = "active";
    const saved = await vendor.save();
    res.status(200).json({ message: "vendor activated", vendor: saved });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.suspendVendor = async (req, res) => {
  try {
    const { id } = req.body;
    const vendor = await Vendor.findOne({ _id: id });
    if (!vendor) {
      return res.status(404).json({ message: "vendor not found" });
    }
    vendor.status = "suspended";
    // await vendor.save();
    const saved = await vendor.save();
    res.status(200).json({ message: "vendor disabled", vendor: saved });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.getActiveVendors = async (req, res) => {
  try {
    const activeVendors = await Vendor.find({ status: "active" });
    res.json(activeVendors);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.getSuspendedVendors = async (req, res) => {
  try {
    const suspendedVendors = await Vendor.find({ status: "suspended" });
    res.json(suspendedVendors);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
