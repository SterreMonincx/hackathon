import React, { useState } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const generateBotResponse = (userMessage: string): string => {
    const responses = [
      "I understand you're asking about Slack messages. Let me help you with that!",
      "That's a great question about your Slack conversations. Here's what I found...",
      "Based on your Slack messages, I can provide you with the following information:",
      "I've analyzed your Slack data and here's what I discovered:",
      "Let me search through your Slack messages to find relevant information...",
    ];

    // Simple response logic - in real implementation, this would connect to actual Slack API
    if (userMessage.toLowerCase().includes('summary') || userMessage.toLowerCase().includes('summarize')) {
      return "I'd be happy to summarize your messages! Once connected to your Slack workspace, I'll provide comprehensive summaries of your conversations, meetings, and important updates.";
    }
    
    if (userMessage.toLowerCase().includes('team') || userMessage.toLowerCase().includes('colleagues')) {
      return "I can help you track team communications! I'll analyze messages from your team members and highlight important updates, decisions, and action items.";
    }

    if (userMessage.toLowerCase().includes('project')) {
      return "Project-related messages are important! I can filter and organize all project discussions, deadlines, and progress updates from your Slack channels.";
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(text),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  return (
    <div className="h-screen flex flex-col bg-white font-inter">
      <Header />
      <ChatArea messages={messages} isTyping={isTyping} />
      <InputArea onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
}

export default App;