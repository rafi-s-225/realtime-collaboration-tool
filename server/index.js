const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Document = require("./models/Document");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.send("Collaboration Tool Backend Running!");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    let document = await Document.findById(roomId);
    if (!document) {
      document = await Document.create({ _id: roomId, content: "" });
    }
    socket.emit("load-document", document.content);
  });

  socket.on("send-changes", (content, roomId) => {
    console.log(`📤 Changes received from ${socket.id} for room ${roomId}`);
    socket.to(roomId).emit("receive-changes", content);
    console.log(`📨 Changes sent to other users in room ${roomId}`);
  });

  socket.on("save-document", async (roomId, content) => {
    await Document.findByIdAndUpdate(roomId, { content });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
