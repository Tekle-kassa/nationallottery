const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const phoneNumberFormatter = require("../middlewares/phoneNumberFormatter");
const Ticket = require("../models/ticket");
const Lottery = require("../models/lottery");
const Prize = require("../models/prize");
const Otp = require("../models/otp");
const Chapa = require("chapa");
const axios = require("axios").default;
let myChapa = new Chapa("CHASECK_TEST-mdEmZgOYeHlwX9Uq58AzPO1uaOSEpDkC");
let myChapa2 = new Chapa("CHASECK_TEST-ChPbA58gx67mTFi1V1vzhNGl9GPf2ArF");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex =
    /(^\+\s*2\s*5\s*1\s*(9|7)\s*(([0-9]\s*){8}\s*)$)|(^0\s*(9|7)\s*(([0-9]\s*){8})$)/;
  return phoneRegex.test(phoneNumber);
};
async function sendSms(phoneNumber, ticketNumber, lottery, quantity) {
  try {
    let lotto = lottery;
    if (lottery === "Gena") {
      lotto = "ገና";
    } else if (lottery === "Medebegna") {
      lotto = "መደበኛ";
    }
    let x = `ውድ ደንበኛችን የ${lotto} ሎተሪን ስለቆረጡ እናመሰግናለን፡፡ የዕጣ ቁጥርዎ ${ticketNumber} ሲሆን ይሀንን እጣ ቁጥር የገዙት ${quantity} ጊዜ ነው፡፡  ደንብና ግዴታዎች ተፈጻሚነት አላቸው፡፡ ለተጨማሪ መረጃ 8989 ላይ ይደውሉ፡፡ መልካም ዕድል! ብሔራዊ ሎተሪ አስተዳደር`;
    const geezSMSConfig = {
      token: "s6Et6bByZckTc0Z00FCV5SO9L44DyHRi",
    };
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://api.geezsms.com/api/v1/sms/send?token=${geezSMSConfig.token}&phone=${phoneNumber}&msg=${x}`,
      headers: {},
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}
async function sendMessage(phoneNumber) {
  try {
    const geezSMSConfig = {
      token: "s6Et6bByZckTc0Z00FCV5SO9L44DyHRi",
    };

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://api.geezsms.com/api/v1/sms/otp?token=${geezSMSConfig.token}&phone=${phoneNumber}`,
      headers: {},
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}
module.exports.sendOtp = async (req, res, next) => {
  const { phoneNumber } = req.query;
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
  if (!otpSent.error) {
    const { code } = otpSent;
    const otp = new Otp({
      verificationCode: code,
      phoneNumber: formatedPhoneNumber,
    });
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
  const { name, phoneNumber, password, otp } = req.body;
  try {
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    if (!formatedPhoneNumber || !password || !otp) {
      return res
        .status(400)
        .json({ message: "please fill all the required fields" });
    }
    const userExists = await User.findOne({ phoneNumber: formatedPhoneNumber });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "phone number has already been used" });
    }
    const otpIsCorrect = await Otp.findOne({ verificationCode: otp });
    if (!otpIsCorrect) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    await Otp.deleteOne({ verificationCode: otp });
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
      phoneNumber: user.phoneNumber,
      balance: user.balance,
      ticketsBought: user.ticketsBought,
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
      return res
        .status(400)
        .json({ message: "Invalid phone number or password" });
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
      _id: user._id,
      phoneNumber: user.phoneNumber,
      balance: user.balance,
      ticketsBought: user.ticketsBought,
      token,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
module.exports.forgotPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid phone number" });
    }
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    const user = await User.findOne({ phoneNumber: formatedPhoneNumber });
    if (!user) {
      return res.status(404).json({ message: "user not found " });
    }
    const otpSent = await sendMessage(formatedPhoneNumber);
    if (!otpSent.error) {
      const { code } = otpSent;
      const otp = new Otp({
        verificationCode: code,
        phoneNumber: formatedPhoneNumber,
      });
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
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};

module.exports.verifyOtp = async (req, res) => {
  try {
    const { otp, phoneNumber } = req.body;
    console.log(req.body);
    // const otp = "2337";
    // const phoneNumber = "0942049329";
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid phone number" });
    }
    if (!otp) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const savedOtp = await Otp.findOne({ verificationCode: otp });
    if (!savedOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    const user = await User.findOne({ phoneNumber: formatedPhoneNumber });
    await Otp.deleteOne({ verificationCode: otp });
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
module.exports.resetPassword = async (req, res) => {
  try {
    const { phoneNumber, password, verifiedPassword } = req.body;
    console.log(req.body);
    if (!password || !verifiedPassword || !phoneNumber) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
    const user = await User.findOne({ phoneNumber: formatedPhoneNumber });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    if (password !== verifiedPassword) {
      return res.status(400).json({ message: "passwords must match" });
    }
    user.password = password;
    await user.save();
    res.status(200).json({
      message: "password reset successful,please login",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};
module.exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "user not found " });
    }
    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};

module.exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    // const CALLBACK_URL = "http://localhost:3000/api/user/verify";
    const CALLBACK_URL = "http://localhost:3000/api/user/verify/";
    // console.log(amount);
    // const RETURN_URL = `http://localhost:8080?payment=success`;
    const RETURN_URL =
      "https://national-lottery-web-app.vercel.app?payment=success";
    const TEXT_REF = "tx-myecommerce12345-" + Date.now();
    // console.log(req.body.amount);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userInfo = {
      amount: amount,
      currency: "ETB",
      email: "kassateklee@gmail.com",
      // first_name:"tekle,"
      first_name: user._id,
      last_name: "kassa",
      // phone_number: `${user.phoneNumber}`,
      tx_ref: TEXT_REF,
      callback_url: "",
      return_url: RETURN_URL,
      customization: {
        title: "deposit",
        description: "deposit for purchasing lotteries",
      },
    };
    // console.log(user);
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

module.exports.createSub = async (req, res) => {
  try {
    //const studentId = req.user._id
    var { first_name, last_name, email, currency, amount, status } = req.body;
    // id = email
    console.log(req.body);
    // const txRef = req.body.tx_ref;

    const user = await User.findById(first_name);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.balance += parseInt(amount);
    console.log(user);
    await user.save();

    res.json({
      message: "Payment verification successful",
      user: { balance: user.balance },
    });
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.verify = async (req, res) => {
  try {
    const txRef = req.params.tx_ref;
    console.log(req.body);
    // const txRef = req.body.tx_ref;
    const response = await myChapa.verify(txRef);

    if (response.status === "success") {
      const { amount, first_name } = response.data;
      const user = await User.findById(first_name);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // user.balance += parseInt(amount);
      // console.log(user);
      // await user.save();

      console.log("Payment verification successful");
      res.json({
        message: "Payment verification successful",
        user: { balance: user.balance },
      });
    } else {
      console.log("Payment verification failed");
      return res.status(400).json(response);
    }
  } catch (error) {
    console.error("Error during payment verification:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
module.exports.getLotteries = async (req, res) => {
  try {
    const lotteries = await Lottery.find().populate("prize");
    if (!lotteries) {
      return res.json(404).json({ message: "No Lotteries Found" });
    }
    res.status(200).json(lotteries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};
module.exports.getSpecificLottery = async (req, res) => {
  try {
    const { id } = req.params;
    const lottery = await Lottery.findById(id).populate("prize");
    if (!lottery) {
      return res.status(404).json({ message: "lottery not found" });
    }
    res.status(200).json(lottery);
  } catch (error) {
    res
      .status(500)
      .json({ message: "internal server error", error: error.message });
  }
};
module.exports.getMyLotteries = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "ticketsBought",
      populate: { path: "lottery" },
    });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    const lotteriesMap = new Map();
    user.ticketsBought.forEach((ticket) => {
      console.log(ticket);
      const lotteryName = ticket.lottery.name;

      if (!lotteriesMap.has(lotteryName)) {
        lotteriesMap.set(lotteryName, []);
      }

      lotteriesMap.get(lotteryName).push(ticket.number.toString());
    });
    const lotteriesToSend = [];
    for (const [lotteryName, tickets] of lotteriesMap) {
      lotteriesToSend.push({ name: lotteryName, Tickets: tickets });
    }
    res.json(lotteriesToSend);
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .json({ message: "internal server error", error: error.message });
  }
};
module.exports.guest = async (req, res) => {
  try {
    const { lotteryId, ticketNumber, quantity = 1, phoneNumber } = req.body;
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: "invalid phone number" });
    }
    // const user = await User.findOne({ phoneNumber });
    // console.log(req.body);
    const lottery = await Lottery.findById(lotteryId);
    // console.log(lottery);
    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid quantity" });
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

    const RETURN_URL =
      "https://national-lottery-web-app.vercel.app?payment=success";
    const customerInfo = {
      amount: lottery.price * quantity,
      currency: "ETB",
      email: `${phoneNumber}@gmail.com`,
      first_name: lotteryId,
      last_name: ticketNumber,
      phone_number: phoneNumber,
      tx_ref: `lotto${Date.now()}`,
      callback_url: "",
      // return_url: "http://localhost:8080?payment=success",
      return_url: RETURN_URL,
      customization: {
        title: "Lottery",
        description: "payment for Lottery",
      },
    };
    const response = await myChapa2.initialize(customerInfo, { autoRef: true });
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.buyTicket = async (req, res) => {
  var { first_name, last_name, email, currency, amount, status, phone_number } =
    req.body;
  // console.log(req.body);
  const phoneNumber = email.split("@")[0];
  const formatedPhoneNumber = phoneNumberFormatter(phoneNumber);
  const lotery = await Lottery.findById(first_name);
  let user = await User.findOne({ phoneNumber: formatedPhoneNumber });
  if (!user) {
    user = new User({
      phoneNumber: formatedPhoneNumber,
    });
    await user.save();
  }
  const newTickets = [];
  const quantity = amount / lotery.price;
  for (let i = 0; i < quantity; i++) {
    const newTicket = new Ticket({
      number: last_name,
      lottery: first_name,
      user: user._id,
      purchaseDate: Date.now(),
      isAvailable: false,
    });
    // console.log(last_name, newTicket);
    newTickets.push(newTicket);
    user.ticketsBought.push(newTicket._id);
  }
  // console.log(lotery);
  await Ticket.insertMany(newTickets);
  await user.save();
  // console.log(user);
  const smsSent = await sendSms(
    user.phoneNumber,
    last_name,
    lotery.name,
    quantity
  );
  res.json({
    message: "Payment verification successful",
    user,
  });
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
    // send sms here
    // const smsSent = await sendSms(user.phoneNumber, ticketNumber);
    const smsSent = await sendSms(
      user.phoneNumber,
      ticketNumber,
      lottery.name,
      quantity
    );
    res
      .status(200)
      .json({ message: "Ticket selected successfully", newTickets, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
module.exports.generateTicket = async (req, res) => {
  try {
    // const { lotteryId, ticketNumber, quantity, digits } = req.body;
    const { lotteryId } = req.params;

    const lottery = await Lottery.findById(lotteryId);
    if (!lottery) {
      return res.status(400).json({ error: "Couldn't find lottery" });
    }
    function generateRandomNumber() {
      return Math.floor(Math.random() * 10);
    }

    let selectedTickets;
    do {
      lottoNumber = "";
      for (let i = 0; i < lottery.digit; i++) {
        lottoNumber += generateRandomNumber().toString();
      }
      selectedTickets = await Ticket.find({
        number: lottoNumber,
        lottery: lotteryId,
      });
      const count = selectedTickets.length;

      let maxAvailableTickets = 5;
      if (lottery.name === "Medebegna") {
        maxAvailableTickets = 2;
      }
      if (maxAvailableTickets - count > 0) {
        res.status(200).json({
          message: `The available tickets for this ticket is ${
            maxAvailableTickets - count
          }`,
          available: maxAvailableTickets - count,
          ticketNumber: lottoNumber,
        });
        break;
      }
    } while (true);

    // res.status(200).json({ message: "Ticket selected successfully" });
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
