function initSocket(server) {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_ORIGIN || "*", methods: ["GET", "POST"] },
  });
  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log("[socket] client connected", socket.id);
    socket.on("disconnect", () => {});
  });
  return io;
}
module.exports = { initSocket };
