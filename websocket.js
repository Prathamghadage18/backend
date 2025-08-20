import { Server as socketIO } from "socket.io";
import chatController from './controllers/chat.controller.js';

export const initWebSocket = (server) => {
  const io = new socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Initialize chat WebSocket handlers
  chatController.handleWebSocket(io);

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("join-consultant", (consultantId) => {
      socket.join(`consultant_${consultantId}`);
      console.log(`Consultant ${consultantId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return io;
};
