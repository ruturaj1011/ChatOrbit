import { Server } from "socket.io"

export const connectToSocket = (server) => {

    const socketIo = new Server(server);

    return socketIo;
}
