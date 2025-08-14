import React from 'react';
import { Copy, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isUnread?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [showTimestamp, setShowTimestamp] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex mb-4 group animate-slideIn ${
        message.isUser ? 'justify-end' : 'justify-start'
      }`}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
        message.isUser ? 'flex-row-reverse' : 'flex-row'
      }`}>
        <div className={`flex-shrink-0 ${
          message.isUser ? 'ml-3' : 'mr-3'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.isUser 
              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
              : 'bg-purple-100'
          }`}>
            {message.isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-purple-600" />
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <div
            className={`relative px-4 py-3 rounded-2xl shadow-sm ${
              message.isUser
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md'
                : 'bg-purple-50 text-purple-900 rounded-bl-md'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
            {!message.isUser && message.isUnread && (
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full" />
            )}
            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 transform ${
                message.isUser
                  ? 'hover:bg-purple-500 text-purple-200'
                  : 'hover:bg-purple-100 text-purple-600'
              }`}
              title={copied ? 'Copied!' : 'Copy message'}
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          {showTimestamp && (
            <span className={`text-xs text-gray-500 mt-1 px-1 ${
              message.isUser ? 'text-right' : 'text-left'
            }`}>
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;