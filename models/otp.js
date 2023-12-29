const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  verificationCode: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
});

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
