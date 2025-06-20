import { Server } from 'socket.io';

let io;
const userSocketMap = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
        origin: 'http://localhost:5173',
        credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        const userId = socket.handshake.query.userId;
        if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected`);
        }

        socket.on('disconnect', () => {
        for (let id in userSocketMap) {
            if (userSocketMap[id] === socket.id) {
            delete userSocketMap[id];
            console.log(`User ${id} disconnected`);
            break;
            }
        }
        console.log('User disconnected:', socket.id);
        });
    });

    return io;
    };

    export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const getUserSocketMap = () => {
    return userSocketMap;
}; 