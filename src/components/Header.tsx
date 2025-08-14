import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-15 bg-white border-b border-purple-100 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Slack Assistant</h1>
          <p className="text-sm text-purple-600">Ask me about your messages</p>
        </div>
      </div>
      <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
        <Settings className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  );
};

export default Header;