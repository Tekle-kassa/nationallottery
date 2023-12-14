const Chapa = require("chapa");
const Lottery = require("../models/lottery");
const Ticket = require("../models/ticket");
const User = require("../models/user");
const Vendor = require("../models/vendor");

let myChapa = new Chapa("CHASECK_TEST-7mSnUUlCknqZrInKDc9QusA7zy7KNONq");

function generateRandomNumber() {
  const min = 100000;
  const max = 9999999;

  // Generate a random number within the specified range
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

// Example usage
const randomNum = generateRandomNumber();

module.exports.payLottery = async (req, res) => {
  try {
    // const id = req.user._id;
    const { lotteryId, ticketNumber, phoneNumber } = req.body;
    const lotteryType = await Lottery.findById(lotteryId);
    // const name = lotteryType.name;

    const selectedTickets = await Ticket.find({
      number: ticketNumber,
      lottery: lotteryId,
    });

    const count = selectedTickets.length;
    let maxAvailableTickets = 5;
    // const lottery = await Lottery.findOne({ _id: lotteryId });
    // if (lottery.name === "Medebegna") {
    //   maxAvailableTickets = 2;
    // }
    if (count >= maxAvailableTickets) {
      return res
        .status(400)
        .json({ error: "Ticket not available for selection" });
    }

    const customerInfo = {
      amount: 50,
      currency: "ETB",
      email: "6572b7fe1a03c970adb77f29@gmail.com",
      first_name: lotteryId,
      last_name: ticketNumber,
      phone_number: phoneNumber,
      tx_ref: `lotto${randomNum}`,
      callback_url: "http://localhost:3000/api/user/ticket",
      return_url: "http://localhost:3000/",
      customization: {
        title: "Lottery",
        description: "payment for Lottery",
      },
    };

    const response = await myChapa.initialize(customerInfo, { autoRef: true });

    res.json(response);
    //res.redirect(response.data.checkout_url)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.customerBalance = async (req, res) => {
  const { phoneNumber, amount } = req.body;
  // let id;
  try {
    const userExist = await User.findById(req.user._id);
    const vendor = await Vendor.findById(req.user._id);

    if (vendor) {
      id = vendor._id;
    }

    if (userExist) {
      // phoneNumber = userExist.phoneNumber;

      const user = await User.findOne({ phoneNumber });
      //   if (!user) {
      //     user = new User({
      //       phoneNumber,
      //     });

      //     await user.save();
      //   }
      //   id = user_id;
    }
    const customerInfo = {
      amount: amount,
      currency: "ETB",
      email: "tekle@gmail.com",
      first_name: userExist._id,
      last_name: "kassa",
      phone_number: phoneNumber,
      tx_ref: `lotto${randomNum}`,
      callback_url: "http://localhost:3000/api/pay/addBalance",
      return_url: "http://localhost:3000/",
      customization: {
        title: "Lottery",
        description: "payment for Lottery",
      },
    };

    const response = await myChapa.initialize(customerInfo, { autoRef: true });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.addBalance = async (req, res) => {
  try {
    const { first_name, phone_number, amount } = req.body;

    const user = await User.findById({ phone_number });
    const vendor = await Vendor.findById({ first_name });
    if (user) {
      user.balance += amount;
      await user.save();
    }
    if (vendor) {
      vendor.balance += amount;
      await vendor.save();
    }

    req.status(200).json(user.balance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const customerInfo = {
      amount: amount,
      currency: "ETB",
      email: "tekle@gmail.com",
      first_name: user._id,
      last_name: "kassa",
      phone_number: user.phoneNumber,
      tx_ref: `lotto${randomNum}`,
      callback_url: "http://localhost:3000/api/pay/verify",
      return_url: "http://localhost:3000/",
      customization: {
        title: "Lottery",
        description: "payment for Lottery",
      },
    };
    const response = await myChapa.initialize(customerInfo, { autoRef: true });
    res.json(response);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports.verify = async (req, res) => {
  try {
    const { first_name, amount } = req.body;
    const user = await User.findById(first_name);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.balance += amount;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
