const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  _id: String,
  title: {
    type: String,
    default: "Untitled Workspace",
  },
  type: {
    type: String,
    enum: ["doc", "board"],
    default: "doc",
  },
  content: {
    type: String,
    default: "",
  },
  boardData: {
    type: Array,
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", RoomSchema);