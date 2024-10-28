import React from 'react';

const ChatbotResponseViewer = ({ response }) => {
  const handleCopy = (e) => {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
      e.clipboardData.setData('text/plain', selectedText);
      console.log('Copied text:', selectedText);
    }
  };

  return (
    <div className="chatbot-response-viewer">
      <h3>Chatbot Response</h3>
      <div
        onCopy={handleCopy}
        style={{
          minHeight: '100px',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          whiteSpace: 'pre-wrap'
        }}
      >
        {response}
      </div>
    </div>
  );
};

export default ChatbotResponseViewer;