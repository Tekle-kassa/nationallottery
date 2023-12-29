const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  name: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: [
      /(^\+\s*2\s*5\s*1\s*(9|7)\s*(([0-9]\s*){8}\s*)$)|(^0\s*(9|7)\s*(([0-9]\s*){8})$)/,
      "please enter a valid phone number",
    ],
  },
  password: {
    type: String,
  },
  balance: {
    type: Number,
    default: 50,
  },
  ticketsBought: [
    {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
    },
  ],
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
