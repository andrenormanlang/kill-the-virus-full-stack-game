import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from './src/app';
import http from 'http';
import { Server } from 'socket.io';
import { handleConnection } from './src/controllers/socket_controller';
import { ServerToClientEvents, ClientToServerEvents } from './src/types/shared/socket_types';

// Initialize dotenv so it reads our `.env` file
dotenv.config();

// Read port to start server on from `.env`, otherwise default to port 3000
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:example@localhost:27017/ktv?authSource=admin';

// Connect to MongoDB
mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

/**
 * Create HTTP and Socket.Io server
 */
const httpServer = http.createServer(app)
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: '*',
        credentials: true,
    }
})

/**
 * Handle incoming Socket.Io connection
 */
io.on('connection', (socket) => {
    handleConnection(socket)
})

io.on('disconnect', () => {
    // Handle disconnection logic if needed
})

/**
 * Listen on provided port, on all network interfaces.
 */
httpServer.listen(PORT)

/**
 * Event listener for HTTP server "error" event.
 */
httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.syscall !== 'listen') {
        throw err;
    }

    switch (err.code) {
        case 'EACCES':
            console.error(`🦸🏻 Port ${PORT} requires elevated privileges`)
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(`🛑 Port ${PORT} is already in use`)
            process.exit(1)
            break
        default:
            throw err
    }
})

/**
 * Event listener for HTTP server "listening" event.
 */
httpServer.on('listening', () => {
    console.log(`🧑🏻‍🍳 Yay, server started on http://localhost:${PORT}`)
})
