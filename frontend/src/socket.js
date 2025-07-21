import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket'],
    auth: {
        userId: null
    }
}); 