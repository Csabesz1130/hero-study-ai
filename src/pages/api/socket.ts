import { Server as HttpServer } from 'http'; // Renamed NetServer to HttpServer for clarity
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Socket as NetSocket } from 'net'; // Import Socket from 'net'

// Define an extended NextApiResponse type to include the socket property
export interface NextApiResponseServerIO extends NextApiResponse {
  socket: NetSocket & { // Use NetSocket here
    server: HttpServer & { // Use HttpServer here
      io?: SocketIOServer;
    };
  };
}

// Disable the default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
  } else {
    console.log('Initializing Socket.IO server...');
    const httpServer: HttpServer = res.socket.server as any; // Cast to HttpServer
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket_io', // Client will connect to this specific path
      addTrailingSlash: false,
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      socket.on('document_change', (data) => {
        console.log(`Document change from ${socket.id}:`, data);
        socket.broadcast.emit('document_updated', data);
      });

      socket.on('hello_server', (msg) => {
        console.log(`Message from ${socket.id}: ${msg}`);
        socket.emit('hello_client', `Server received: ${msg}`);
      });
    });
  }
  res.end();
};

export default SocketHandler;
