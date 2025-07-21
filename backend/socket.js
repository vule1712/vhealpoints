import { Server } from 'socket.io';

let io;
// Change userSocketMap to store arrays of socket IDs per user
const userSocketMap = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                'https://vhealpoints.vercel.app',
                'https://vhealpoints.onrender.com',
                'http://localhost:5173'
            ],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        const userId = socket.handshake.auth.userId;
        if (userId) {
            // Add this socket ID to the user's array
            if (!userSocketMap[userId]) {
                userSocketMap[userId] = [];
            }
            userSocketMap[userId].push(socket.id);
            console.log(`User ${userId} connected with socket ${socket.id}`);
            console.log('Current userSocketMap:', userSocketMap);
        } else {
            console.log('User connected without userId');
        }

        socket.on('disconnect', () => {
            for (let id in userSocketMap) {
                userSocketMap[id] = userSocketMap[id].filter(sid => sid !== socket.id);
                if (userSocketMap[id].length === 0) {
                    delete userSocketMap[id];
                    console.log(`User ${id} disconnected (all sockets closed)`);
                }
            }
            console.log('User disconnected:', socket.id);
            console.log('Updated userSocketMap:', userSocketMap);
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

// Helper to emit to all sockets for a user
const emitToUser = (userId, event, data) => {
    if (io && userSocketMap[userId]) {
        userSocketMap[userId].forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
    }
};

// Function to emit dashboard updates for admin
export const emitAdminDashboardUpdate = (stats) => {
    if (io) {
        io.emit('admin-dashboard-update', stats);
    }
};

// Function to emit dashboard updates for doctor
export const emitDoctorDashboardUpdate = (doctorId, stats) => {
    console.log('=== emitDoctorDashboardUpdate START ===');
    console.log('emitDoctorDashboardUpdate called with:', { doctorId, stats });
    emitToUser(doctorId, 'doctor-dashboard-update', stats);
    console.log('=== emitDoctorDashboardUpdate END ===');
};

// Function to emit dashboard updates for patient
export const emitPatientDashboardUpdate = (patientId, stats) => {
    console.log('=== emitPatientDashboardUpdate START ===');
    console.log('emitPatientDashboardUpdate called with:', { patientId, stats });
    emitToUser(patientId, 'patient-dashboard-update', stats);
    console.log('=== emitPatientDashboardUpdate END ===');
}; 