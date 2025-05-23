
import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
  timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, type = 'text', timestamp }) => {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-3xl px-4 py-3 rounded-lg ${
        role === 'user' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {type === 'image' ? (
          <div className="space-y-2">
            <p className="text-sm opacity-75">Generated image:</p>
            <img 
              src={`data:image/png;base64,${content}`} 
              alt="Generated image" 
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        <p className={`text-xs mt-2 opacity-75`}>
          {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
