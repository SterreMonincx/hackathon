import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start mb-4 animate-slideIn">
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100">
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
        </div>
        <div className="bg-purple-50 text-purple-900 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;