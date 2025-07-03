import React from 'react';
import SharedDocumentEditor from '@/components/SharedDocumentEditor'; // Using '@/' for absolute import from src

const SharedDocPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Collaborative Document Page</h1>
      <p>
        This page demonstrates real-time document collaboration using WebSockets.
        Open this page in multiple browser tabs or windows to see changes sync.
      </p>
      <SharedDocumentEditor />
    </div>
  );
};

export default SharedDocPage;
