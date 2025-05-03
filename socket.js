const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust based on your frontend URL
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("🟢 A user connected");

        socket.on("new-booking", (data) => {
            io.emit("notify-barber", data); // Notify the barber
        });

        socket.on("chat-message", (msg) => {
            io.emit("chat-message", msg);
        });

        socket.on("disconnect", () => console.log("🔴 A user disconnected"));
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIo };
