const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema({
  lottery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lottery",
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
  },
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prize",
  },
  winning_date: Date,
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Winner = mongoose.model("Winner", winnerSchema);

module.exports = Winner;
