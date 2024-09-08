const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // For generating unique share codes

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store shared locations by code
let sharedLocations = {};

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("A user connected");

  // Receive the device location from the client
  socket.on("deviceLocation", (locationData) => {
    console.log("Location received:", locationData);
    // Broadcast the location to all connected clients
    io.emit("updateLocation", locationData);
  });

  // When a user shares their location
  socket.on("shareLocation", (locationData) => {
    const shareCode = uuidv4(); // Generate unique code
    sharedLocations[shareCode] = locationData;

    // Send the share code back to the user
    socket.emit("shareCodeGenerated", shareCode);
  });

  // When a user wants to view a shared location
  socket.on("viewSharedLocation", (shareCode) => {
    const location = sharedLocations[shareCode];

    if (location) {
      // Send the location back to the user
      socket.emit("sharedLocationData", location);
    } else {
      socket.emit("error", "Invalid share code");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
