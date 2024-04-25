const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const wss = new WebSocket.Server({ server });

const loggingFilePath = "websocket_logs.txt";

// Keep track of connected clients
const clients = new Set();

wss.on("connection", (ws, req) => {
  const userId = uuidv4();
  console.log(`User#${userId} connected`);

  const clientIp = req.socket.remoteAddress;
  // Add the new client to the set
  clients.add(ws);

  // Event listener for receiving messages
  ws.on("message", (message) => {
    const messageObj = JSON.parse(message);
    if (messageObj.type == "image") {
      logMessage(userId, "sended image");
    } else {
      logMessage(userId, messageObj.message);
    }

    broadcast(
      JSON.stringify({
        user: userId,
        message: messageObj,
        client_ip: clientIp,
      })
    );
  });

  // Event listener for closing the connection
  ws.on("close", () => {
    console.log("Client disconnected");

    // Remove the disconnected client from the set
    clients.delete(ws);
  });
});

function logMessage(userId, message) {
  const logEntry = `${new Date().toISOString()} - User#${userId}: ${message}\n`;

  // Append the log entry to the file
  fs.appendFile(loggingFilePath, logEntry, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
}

// Broadcast a message to all connected clients
function broadcast(message) {
  clients.forEach((client) => {
    // Check if the client is still connected before sending the message
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
