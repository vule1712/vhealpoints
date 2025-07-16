import { Server } from 'socket.io';

let io;
const userSocketMap = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                'https://vhealpoints.vercel.app',
                'http://localhost:5173'
            ],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        const userId = socket.handshake.auth.userId;
        if (userId) {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected with socket ${socket.id}`);
        console.log('Current userSocketMap:', userSocketMap);
        } else {
            console.log('User connected without userId');
        }

        socket.on('disconnect', () => {
        for (let id in userSocketMap) {
            if (userSocketMap[id] === socket.id) {
            delete userSocketMap[id];
            console.log(`User ${id} disconnected`);
            console.log('Updated userSocketMap:', userSocketMap);
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
    
    if (io) {
        const doctorSocketId = userSocketMap[doctorId];
        console.log('emitDoctorDashboardUpdate details:', {
            doctorId,
            doctorSocketId,
            stats,
            userSocketMap: Object.keys(userSocketMap),
            userSocketMapValues: Object.values(userSocketMap)
        });
        if (doctorSocketId) {
            io.to(doctorSocketId).emit('doctor-dashboard-update', stats);
            console.log('Doctor dashboard update sent to socket:', doctorSocketId);
        } else {
            console.log('Doctor not connected to socket:', doctorId);
            console.log('Available users in userSocketMap:', Object.keys(userSocketMap));
        }
    } else {
        console.log('Socket.io not initialized!');
    }
    console.log('=== emitDoctorDashboardUpdate END ===');
};

// Function to emit dashboard updates for patient
export const emitPatientDashboardUpdate = (patientId, stats) => {
    console.log('=== emitPatientDashboardUpdate START ===');
    console.log('emitPatientDashboardUpdate called with:', { patientId, stats });
    
    if (io) {
        const patientSocketId = userSocketMap[patientId];
        console.log('emitPatientDashboardUpdate details:', {
            patientId,
            patientSocketId,
            stats,
            userSocketMap: Object.keys(userSocketMap),
            userSocketMapValues: Object.values(userSocketMap)
        });
        if (patientSocketId) {
            io.to(patientSocketId).emit('patient-dashboard-update', stats);
            console.log('Patient dashboard update sent to socket:', patientSocketId);
        } else {
            console.log('Patient not connected to socket:', patientId);
            console.log('Available users in userSocketMap:', Object.keys(userSocketMap));
        }
    } else {
        console.log('Socket.io not initialized!');
    }
    console.log('=== emitPatientDashboardUpdate END ===');
}; 