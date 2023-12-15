const Admin = require("../models/admin");
const Lottery = require("../models/lottery");
const Prize = require("../models/prize");
const Vendor = require("../models/vendor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const phoneNumberFormatter = require("../middlewares/phoneNumberFormatter");
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex =
    /(^\+\s*2\s*5\s*1\s*(9|7)\s*(([0-9]\s*){8}\s*)$)|(^0\s*(9|7)\s*(([0-9]\s*){8})$)/;
  return phoneRegex.test(phoneNumber);
};
module.exports.registerAdmin = async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    if (!formatedPhoneNumber || !password) {
      res.status(400);
      throw new Error("please fill all the required fields");
    }
    const adminExists = await Admin.findOne({
      phoneNumber: formatedPhoneNumber,
    });
    if (adminExists) {
      res.status(400);
      throw new Error("phone number has already been used");
    }
    const admin = new Admin({
      phoneNumber: formatedPhoneNumber,
      password,
    });
    await admin.save();
    const token = generateToken(admin._id);
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });
    res.status(201).json({
      _id: admin._id,
      phoneNumber: formatedPhoneNumber,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports.loginAdmin = async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    if (!phoneNumber || !password) {
      res.status(400);
      throw new Error("please provide phoneNumber and password");
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      res.status(400);
      throw new Error("please provide a valid phone number");
    }
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    const admin = await Admin.findOne({ phoneNumber: formatedPhoneNumber });
    if (!admin) {
      res.status(400);
      throw new Error("Invalid phone number or password");
    }
    const passwordIsCorrect = await bcrypt.compare(password, admin.password);
    if (!passwordIsCorrect) {
      return res
        .status(400)
        .json({ message: "Invalid phone number or password" });
    }
    const token = generateToken(admin._id);
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 86400 * 30),
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      _id: admin._id,
      phoneNumber: formatedPhoneNumber,
      token,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

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
      maxTickets,
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
      maxTickets,
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
    // console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
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
    return res.status(404).json({ message: "no records", error });
  }
};
module.exports.getLotteryById = async (req, res) => {
  try {
    const { id } = req.body;
    const lottery = await Lottery.findById(id).populate("prize");
    if (!lottery) {
      return res.status(404).json({ message: "lottery not found" });
    }
    res.status(200).json(lottery);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
module.exports.updateLottery = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      startDate,
      drawDate,
      status,
      prize,
      price,
      digit,
      rule,
      maxTickets,
    } = req.body;
    const lotterytoBeUpdated = await Lottery.findById(id).populate("prize");
    // console.log(lottery);
    if (!lotterytoBeUpdated) {
      return res.status(404).json({ message: "lottery not found" });
    }
    if (name) {
      lotterytoBeUpdated.name = name;
    }
    if (startDate) {
      lotterytoBeUpdated.startDate = startDate;
    }
    if (drawDate) {
      lotterytoBeUpdated.drawDate = drawDate;
    }
    if (status) {
      lotterytoBeUpdated.status = status;
    }
    if (prize) {
      lotterytoBeUpdated.prize.prize = prize;
      // console.log(lotterytoBeUpdated.prize);
      const p = await Prize.findById(lotterytoBeUpdated.prize._id);
      p.prize = prize;
      await p.save();
    }
    if (price) {
      lotterytoBeUpdated.price = price;
    }
    if (digit) {
      lotterytoBeUpdated.digit = digit;
    }
    if (rule) {
      lotterytoBeUpdated.rule = rule;
    }
    if (maxTickets) {
      lotterytoBeUpdated.maxTickets = maxTickets;
    }
    const updatedLottery = await lotterytoBeUpdated.save();
    res
      .status(200)
      .json({ message: "Lottery updated successfully", updatedLottery });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
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
    res.status(500).json({ message: "Internal server error", error });
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
    return res.status(404).json({ message: "no records", error });
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
            { phoneNumber: { $regex: regexQuery.toString() } },
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
    // console.log(vendor);
    res.status(200).json({ vendor });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
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
    res.status(500).json({ message: "Internal server error", error });
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
    res.status(500).json({ message: "Internal server error", error });
  }
};
module.exports.getActiveVendors = async (req, res) => {
  try {
    const activeVendors = await Vendor.find({ status: "active" });
    res.json(activeVendors);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
module.exports.getSuspendedVendors = async (req, res) => {
  try {
    const suspendedVendors = await Vendor.find({ status: "suspended" });
    res.json(suspendedVendors);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
