const Vendor = require("../models/vendor");
const Lottery = require("../models/lottery");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// const Ticket = require("../models/ticket");
const phoneNumberFormatter = require("../middlewares/phoneNumberFormatter");
const Ticket = require("../models/ticket");
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex =
    /(^\+\s*2\s*5\s*1\s*(9|7)\s*(([0-9]\s*){8}\s*)$)|(^0\s*(9|7)\s*(([0-9]\s*){8})$)/;
  return phoneRegex.test(phoneNumber);
};
module.exports.loginVendor = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      res.status(400);
      throw new Error("please provide phoneNumber and password");
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      res.status(400);
      throw new Error("please provide a valid phone number");
    }
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    const vendor = await Vendor.findOne({ phoneNumber: formatedPhoneNumber });
    if (!vendor) {
      return res
        .status(400)
        .json({ message: "invalid phone number or password" });
    }
    const passwordIsCorrect = await bcrypt.compare(password, vendor.password);
    if (!passwordIsCorrect) {
      return res
        .status(400)
        .json({ message: "Invalid phone number or password" });
    }
    const token = generateToken(vendor._id);
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 86400 * 30),
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      phoneNumber: formatedPhoneNumber,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports.logoutVendor = async (req, res, next) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({
    message: "successfully logged out",
  });
};
module.exports.resetPassword = async (req, res) => {
  try {
    const { oldPassword, password } = req.body;
    const vendor = await Vendor.findById(req.user._id);
    if (!vendor) {
      return res
        .status(404)
        .json({ message: "vendor not found please signup" });
    }
    if (!oldPassword || !password) {
      res.status(400).json({ message: "please fill all the required fields" });
    }
    const passwordIsCorrect = await bcrypt.compare(
      oldPassword,
      vendor.password
    );
    if (passwordIsCorrect) {
      vendor.password = password;
      await vendor.save();
      res.status(200).send("Password change successful");
    } else {
      res.status(400);
      throw new Error("Old password is incorrect");
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.sellTicket = async (req, res) => {
  try {
    const { ticketNumber, lotteryId, phoneNumber } = req.body;
    const selectedTickets = await Ticket.find({
      number: ticketNumber,
      lottery: lotteryId,
    });
    const lottery = await Lottery.findById(lotteryId);
    if (!lottery) {
      return res.status(400).json({ message: "lottery not found" });
    }
    const count = selectedTickets.length;
    let maxAvailableTickets = 5;
    // const lottery = await Lottery.findById({ lotteryId });
    if (lottery.name === "Medebegna") {
      maxAvailableTickets = 2;
    }
    if (count >= maxAvailableTickets) {
      return res
        .status(400)
        .json({ error: "Ticket not available for selection" });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
      });

      await user.save();
    }
    const selectedTicket = new Ticket({
      number: ticketNumber,
      lottery: lotteryId,
      user: user._id,
      purchaseDate: Date.now(),
      isAvailable: count + 1 < maxAvailableTickets,
      vendor: req.user._id,
    });
    await selectedTicket.save();
    user.ticketsBought.push(selectedTicket._id);
    await user.save();
    // if (count + 1 >= maxAvailableTickets) {
    //   selectedTicket.isAvailable = false;
    // }
    // selectedTicket.vendor = req.user._id;
    // await selectedTicket.save();
    const seller = await Vendor.findById(req.user._id);
    if (seller.balance < lottery.price) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    seller.ticketsSold.push(selectedTicket._id);
    seller.balance -= lottery.price;

    seller.commission += 1;
    await seller.save();
    // console.log(seller);
    res.status(200).json({
      message: "Ticket sold successfully",
      selectedTicket,
      seller,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports.soldTickets = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id).populate("ticketsSold");
    // console.log(vendor);
    if (!vendor) {
      return res
        .status(404)
        .json({ message: "vendor not found please signup" });
    }
    res.status(200).json({ ticketsSold: vendor.ticketsSold });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
