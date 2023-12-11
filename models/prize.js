const mongoose = require("mongoose");
const Schema = mongoose.Schema;

amountSchema = new Schema({
  level: {
    type: Number,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
});

const prizeSchema = new Schema({
  prize: {
    type: [amountSchema],
    required: true,
  },
  lottery: {
    type: Schema.Types.ObjectId,
    ref: "Lottery",
    required: true,
  },
});

const Prize = mongoose.model("Prize", prizeSchema);
module.exports = Prize;
