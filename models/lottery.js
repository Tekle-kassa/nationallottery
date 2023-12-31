const mongoose = require("mongoose");
const Schema = mongoose.Schema;

lotterySchema = new Schema({
  name: {
    type: String,
    //required: true,
    enum: [
      "Enqutatash",
      "Tombolla",
      "Zihon",
      "Gena",
      "Edil",
      "Fetan",
      "Bingo",
      "Medebegna",
    ],
  },
  description: String,
  startDate: {
    type: Date,
    required: true,
  },
  drawDate: {
    type: Date,
    required: true,
  },
  Status: {
    type: String,
    enum: ["Active", "Expired"],
  },
  prize: {
    type: Schema.Types.ObjectId,
    ref: "Prize",
  },
  price: {
    type: Number,
    required: true,
  },
  digit: {
    type: Number,
    default: 6,
    // required: true,
  },
  rule: {
    type: String,
  },
  maxTickets: {
    type: Number,
    default: 5,
  },
});

const Lottery = mongoose.model("Lottery", lotterySchema);

module.exports = Lottery;
