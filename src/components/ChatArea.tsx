import React, { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-purple-25 p-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Welcome to Slack Assistant
              </h3>
              <p className="text-gray-600 max-w-sm">
                Ask me anything about your Slack messages. I'm here to help you find information, summarize conversations, and more.
              </p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatArea;