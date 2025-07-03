import React, { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const SharedDocumentEditor: React.FC = () => {
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection.
    // We need to fetch from the relative path to our API route.
    // IMPORTANT: The path option for the client must match the server.
    fetch('/api/socket_io').finally(() => {
      const socket = io({
        path: '/api/socket_io',
        addTrailingSlash: false
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to Socket.IO server:', socket.id);
        setIsConnected(true);
        socket.emit('hello_server', 'Hello from client!'); // Test message
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.IO server:', reason);
        setIsConnected(false);
      });

      socket.on('document_updated', (newContent: string) => {
        console.log('Received document update:', newContent);
        // To prevent an infinite loop of updates if the user is also typing,
        // you might want to add more sophisticated state management or checks here.
        // For now, we directly set the content.
        setDocumentContent(newContent);
      });

      socket.on('hello_client', (msg: string) => {
        console.log('Server says:', msg);
      });

      // Cleanup on component unmount
      return () => {
        if (socketRef.current) {
          console.log('Disconnecting socket...');
          socketRef.current.disconnect();
        }
      };
    });
  }, []); // Empty dependency array means this effect runs once on mount

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setDocumentContent(newContent);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('document_change', newContent);
    }
  };

  return (
    <div>
      <h2>Shared Document Editor</h2>
      <p>Status: {isConnected ? `Connected (ID: ${socketRef.current?.id})` : 'Disconnected'}</p>
      <textarea
        value={documentContent}
        onChange={handleInputChange}
        rows={10}
        cols={80}
        placeholder="Start typing your collaborative document..."
        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'monospace' }}
      />
    </div>
  );
};

export default SharedDocumentEditor;
