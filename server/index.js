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
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "*" }));
app.use(express.json());

let isMongoConnected = false;

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/realtime_collab")
  .then(() => {
    isMongoConnected = true;
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log(" MongoDB Connection warning (Using In-Memory fallback store):", err.message);
  });

const memoryStore = {};

const getRoomData = async (roomId, defaultType = "doc", defaultTitle = "Untitled Room") => {
  if (isMongoConnected) {
    try {
      let doc = await Document.findById(roomId);
      if (!doc) {
        doc = await Document.create({
          _id: roomId,
          title: defaultTitle,
          type: defaultType,
          content: "",
          boardData: [],
        });
      }
      return doc;
    } catch (e) {
      console.error("DB Fetch Error, using memory store:", e.message);
    }
  }

  if (!memoryStore[roomId]) {
    memoryStore[roomId] = {
      _id: roomId,
      title: defaultTitle,
      type: defaultType,
      content: defaultType === "doc" ? "# Welcome to Realtime Collaboration Tool\n\nStart typing or collaborating in real-time!" : "",
      boardData: [],
      updatedAt: new Date(),
    };
  }
  return memoryStore[roomId];
};

const saveRoomData = async (roomId, updateData) => {
  if (memoryStore[roomId]) {
    memoryStore[roomId] = { ...memoryStore[roomId], ...updateData, updatedAt: new Date() };
  }
  if (isMongoConnected) {
    try {
      await Document.findByIdAndUpdate(roomId, { ...updateData, updatedAt: new Date() }, { upsert: true });
    } catch (e) {
      console.error("DB Save Error:", e.message);
    }
  }
};

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Realtime Collaboration Backend API & WebSocket Server Running",
    mongo: isMongoConnected ? "connected" : "in-memory fallback mode",
  });
});

// REST Endpoint to fetch recent rooms
app.get("/api/rooms", async (req, res) => {
  try {
    if (isMongoConnected) {
      const dbRooms = await Document.find({}).sort({ updatedAt: -1 }).limit(20);
      return res.json(dbRooms);
    }
    const roomsArray = Object.values(memoryStore).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(roomsArray);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track users per room
const roomUsers = {};
const userColors = ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Join Room
  socket.on("join-room", async ({ roomId, username, roomType, roomTitle }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username || `Collaborator-${socket.id.substring(0, 4)}`;

    const userColor = userColors[Math.floor(Math.random() * userColors.length)];
    socket.userColor = userColor;

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    
    // Avoid duplicate users for same socket
    roomUsers[roomId] = roomUsers[roomId].filter((u) => u.id !== socket.id);
    roomUsers[roomId].push({
      id: socket.id,
      username: socket.username,
      color: userColor,
    });

    // Send updated user list to everyone in room
    io.to(roomId).emit("room-users", roomUsers[roomId]);

    // Load initial room state
    const room = await getRoomData(roomId, roomType, roomTitle);
    socket.emit("load-room", room);

    console.log(`👤 User "${socket.username}" joined room [${roomId}] (${room.type})`);
  });

  // Document text change
  socket.on("send-changes", ({ content, roomId }) => {
    socket.to(roomId).emit("receive-changes", content);
    saveRoomData(roomId, { content });
  });

  // Title change
  socket.on("update-title", ({ title, roomId }) => {
    socket.to(roomId).emit("title-updated", title);
    saveRoomData(roomId, { title });
  });

  // Whiteboard drawing stroke add/update
  socket.on("draw-stroke", ({ stroke, roomId }) => {
    socket.to(roomId).emit("receive-stroke", stroke);
  });

  // Sync entire whiteboard data array
  socket.on("sync-board-data", ({ boardData, roomId }) => {
    socket.to(roomId).emit("receive-board-data", boardData);
    saveRoomData(roomId, { boardData });
  });

  // Clear whiteboard canvas
  socket.on("clear-canvas", (roomId) => {
    socket.to(roomId).emit("canvas-cleared");
    saveRoomData(roomId, { boardData: [] });
  });

  // Live collaborator cursor movements
  socket.on("cursor-move", ({ x, y, roomId }) => {
    socket.to(roomId).emit("user-cursor-moved", {
      id: socket.id,
      username: socket.username,
      color: socket.userColor,
      x,
      y,
    });
  });

  // Real-time Chat message
  socket.on("send-chat", ({ message, roomId }) => {
    const chatMsg = {
      id: Date.now().toString(),
      sender: socket.username,
      color: socket.userColor,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    io.to(roomId).emit("receive-chat", chatMsg);
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && roomUsers[roomId]) {
      roomUsers[roomId] = roomUsers[roomId].filter((u) => u.id !== socket.id);
      io.to(roomId).emit("room-users", roomUsers[roomId]);
      socket.to(roomId).emit("user-left", socket.id);
    }
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Collaboration Server active on port ${PORT}`));