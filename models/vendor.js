const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

// const ticketSchema = new Schema({
//   type: Schema.Types.ObjectId,
//   ref: "Ticket",
// });
const vendorSchema = new Schema({
  name: {
    type: String,
    required: true,
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
  balance: {
    type: Number,
  },
  password: {
    type: String,
  },
  ticketsSold: [
    {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
    },
  ],
  status: {
    type: String,
    enum: ["active", "suspended"],
    default: "active",
  },
  commission: {
    type: Number,
    default: 0,
  },
});
vendorSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
  }
});

const Vendor = mongoose.model("Vendor", vendorSchema);
module.exports = Vendor;
