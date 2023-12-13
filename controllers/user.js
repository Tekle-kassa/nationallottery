const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const phoneNumberFormatter = require("../middlewares/phoneNumberFormatter");
const Ticket = require("../models/ticket");
const Lottery = require("../models/lottery");
const Prize = require("../models/prize");
const Otp = require("../models/otp");
const Chapa = require("chapa");
let myChapa = new Chapa("CHASECK_TEST-7mSnUUlCknqZrInKDc9QusA7zy7KNONq");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex =
    /(^\+\s*2\s*5\s*1\s*(9|7)\s*(([0-9]\s*){8}\s*)$)|(^0\s*(9|7)\s*(([0-9]\s*){8})$)/;
  return phoneRegex.test(phoneNumber);
};
const sendMessage = async (phoneNumber) => {
  const server = "https://sms.yegara.com/api2/send";
  const username = "biqiltuvas";
  const password = ";g77qYVu!t3Nb;Mz[U3";
  const verificationCode = Math.floor(1000 + Math.random() * 9000);
  const postData = {
    to: phoneNumber,
    message: verificationCode.toString(), // Convert to string for sending as message
    template_id: "otp",
    password,
    username,
  };
  try {
    const fetchModule = await import("node-fetch");
    const fetch = fetchModule.default;
    const response = await fetch(server, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    // const responseText = await response.text();
    if (response.ok) {
      return { success: true, verificationCode: verificationCode.toString() };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return { success: false };
  }
};
module.exports.sendOtp = async (req, res, next) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid phone number" });
  }
  const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
  const userExists = await User.findOne({
    phoneNumber: formatedPhoneNumber,
  });
  if (userExists) {
    return res
      .status(400)
      .json({ message: "Phone number has already been used" });
  }
  const otpSent = await sendMessage(formatedPhoneNumber);
  if (otpSent.success) {
    const { verificationCode } = otpSent;
    const otp = new Otp({ verificationCode });
    await otp.save();
    return res.status(200).json({
      success: true,
      message: "SMS sent successfully",
      phoneNumber: formatedPhoneNumber,
    });
  } else {
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code via SMS",
    });
  }
};
module.exports.registerUser = async (req, res) => {
  const { name, phoneNumber, password } = req.body;
  try {
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    if (!formatedPhoneNumber || !password || !name) {
      res.status(400);
      throw new Error("please fill all the required fields");
    }
    const userExists = await User.findOne({ phoneNumber: formatedPhoneNumber });
    if (userExists) {
      res.status(400);
      throw new Error("phone number has already been used");
    }
    // const otpIsCorrect = await Otp.findOne({ verificationCode: otp });
    // if (!otpIsCorrect) {
    //   return res.status(401).json({ message: "Invalid OTP" });
    // }
    // await Otp.deleteOne({ verificationCode: otp });
    const user = new User({
      name,
      phoneNumber: formatedPhoneNumber,
      password,
    });

    await user.save();
    const token = generateToken(user._id);
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400 * 30),
      sameSite: "none",
      secure: true,
    });
    res.status(201).json({
      _id: user._id,
      phoneNumber: formatedPhoneNumber,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: "please provide phone number and password" });
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      return res
        .status(400)
        .json({ message: "please provide a valid phone number" });
    }
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    const user = await User.findOne({ phoneNumber: formatedPhoneNumber });
    if (!user) {
      res.status(400);
      throw new Error("Invalid phone number or password");
    }
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    if (!passwordIsCorrect) {
      return res
        .status(400)
        .json({ message: "Invalid phone number or password" });
    }
    const token = generateToken(user._id);
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
    res.status(500).json(error);
  }
};

module.exports.logoutUser = async (req, res, next) => {
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
module.exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "user not found " });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json(error);
  }
};
module.exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    // console.log(req.body.amount);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userInfo = {
      amount: amount,
      currency: "ETB",
      email: "kassateklee@gmail.com",
      first_name: user._id,
      last_name: "kassa",
      // phone_number: `${user.phoneNumber}`,
      tx_ref: `lotto${Date.now()}`,
      callback_url: "  https://17be-196-188-78-148.ngrok.io",
      return_url: "http://localhost:3000/",
      customization: {
        title: "deposit",
        description: "deposit for purchasing lotteries",
      },
    };
    const response = await myChapa.initialize(userInfo, { autoRef: true });
    // user.balance += parseInt(amount);
    // await user.save();
    res.json({
      // message: "Deposit successful",
      response,
      // balance: user.balance,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.verify = async (req, res) => {
  try {
    const txRef = req.params.tx_ref;
    const response = await myChapa.verify(txRef);

    if (response.status === "success") {
      const { amount, first_name } = response.data;
      const user = await User.findById(first_name);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.balance += parseInt(amount);
      await user.save();

      console.log("Payment verification successful");
      res.json({
        message: "Payment verification successful",
        user: { balance: user.balance },
      });
    } else {
      console.log("Payment verification failed");
      res.status(400).json(response);
    }
  } catch (error) {
    console.error("Error during payment verification:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.selectTicket = async (req, res) => {
  try {
    const { lotteryId, ticketNumber, quantity } = req.body;
    const user = await User.findById(req.user._id);
    const lottery = await Lottery.findById(lotteryId);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid quantity" });
    }

    if (user.balance < lottery.price * quantity) {
      return res.status(400).json({
        message: "insufficient fund please deposit to buy this lottery",
        user,
      });
    }
    const selectedTickets = await Ticket.find({
      number: ticketNumber,
      lottery: lotteryId,
    });
    const count = selectedTickets.length;
    let maxAvailableTickets = 5;
    if (lottery.name === "Medebegna") {
      maxAvailableTickets = 2;
    }
    if (count >= maxAvailableTickets) {
      return res
        .status(400)
        .json({ error: "Ticket not available for selection" });
    }
    if (maxAvailableTickets - count < quantity) {
      return res.status(400).json({
        message: "Not enough available tickets for the requested quantity",
        available: maxAvailableTickets - count,
      });
    }
    const newTickets = [];
    for (let i = 0; i < quantity; i++) {
      const newTicket = new Ticket({
        number: ticketNumber,
        lottery: lotteryId,
        user: user._id,
        purchaseDate: Date.now(),
        isAvailable: false,
      });
      newTickets.push(newTicket);
      user.ticketsBought.push(newTicket._id);
    }
    user.balance -= lottery.price * quantity;
    await Ticket.insertMany(newTickets);
    await user.save();
    res
      .status(200)
      .json({ message: "Ticket selected successfully", newTickets, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.fetanLotto = async (req, res) => {
  try {
    const { lotteryId } = req.body;
    const user = await User.findById(req.user._id);

    const lotteryType = await Lottery.findById({ lotteryId });

    if (user.balance < 5) {
      res.status(400);
      throw new Error("you don't have enough balance please recharge");
    }
    if (lotteryType.name == "Fetan") {
      const randomNumber = Math.random();
      let win;
      let message;
      const prizes = await Prize.find({ lottery: lotteryId });

      if (randomNumber < 0.8) {
        // 80% probability
        win = 0;
        message = "Sorry, you didn't win this time.";
      } else if (randomNumber < 0.9) {
        // 10% probability
        win = prizes.prize.amount[2];
        message = "Congratulations! You won 5 Birr.";
      } else if (randomNumber < 0.98) {
        // 8% probability
        win = prizes.prize.amount[1];
        message = "Wow! You won 1000 Birr.";
      } else {
        // 2% probability
        win = prizes.prize.amount[0];
        message = "Jackpot! You won 25,000 Birr";
      }

      user.balance += win;
      await user.save();

      res.json({ win, message });
    }
  } catch (error) {}
};
