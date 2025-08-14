import React, { useState } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import SlackSidebar, { SlackConversation } from './components/SlackSidebar';
import SlackSettingsModal from './components/SlackSettingsModal';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isUnread?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackHasConfig, setSlackHasConfig] = useState(false);
  const [conversations, setConversations] = useState<SlackConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    // Optimistically add the user message
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const historyForApi = [...messages, userMessage].map(m => ({
        isUser: m.isUser,
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const botText = typeof data?.text === 'string' && data.text.trim().length > 0
        ? data.text
        : "I'm having trouble responding right now. Please try again.";

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      if (speakEnabled && 'speechSynthesis' in window) {
        try {
          // Signal input to pause listening while we speak
          window.dispatchEvent(new CustomEvent('assistant-speaking', { detail: { speaking: true } }));
          const utter = new SpeechSynthesisUtterance(botText);
          utter.rate = 1.0;
          utter.pitch = 1.0;
          utter.onend = () => {
            window.dispatchEvent(new CustomEvent('assistant-speaking', { detail: { speaking: false } }));
          };
          window.speechSynthesis.speak(utter);
        } catch {}
      }
    } catch (error) {
      const botMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Sorry, there was an error contacting the assistant.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const checkSlackStatus = async () => {
    try {
      const resp = await fetch('/api/slack/status');
      const data = await resp.json();
      setSlackConnected(Boolean(data.connected));
      setSlackHasConfig(Boolean(data.hasConfig));
    } catch {}
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const resp = await fetch('/api/slack/conversations');
      if (!resp.ok) throw new Error('Failed conversations');
      const data = await resp.json();
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessagesForConversation = async (conversationId: string) => {
    try {
      const resp = await fetch(`/api/slack/messages/${encodeURIComponent(conversationId)}`);
      if (!resp.ok) throw new Error('Failed messages');
      const data = await resp.json();
      const msgs: Message[] = (data.messages || []).reverse().map((m: any) => ({
        id: m.ts,
        text: m.text,
        isUser: false,
        timestamp: new Date(Number(m.ts) * 1000),
        isUnread: Boolean(m.is_unread),
      }));
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    loadMessagesForConversation(id);
  };

  const handleConnectSlack = async () => {
    try {
      const resp = await fetch('/api/slack/status');
      const data = await resp.json();
      if (!data.hasConfig) {
        setSettingsOpen(true);
        return;
      }
    } catch {}
    window.location.href = '/api/slack/install';
  };

  React.useEffect(() => {
    checkSlackStatus().then(() => {
      if (slackConnected) {
        loadConversations();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slackConnected]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth_error')) {
      // Surface a quick hint and open settings so user can correct credentials
      setSettingsOpen(true);
      // Remove the flag from URL to avoid repeated prompts on HMR
      params.delete('oauth_error');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white font-inter">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <SlackSidebar
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          connected={slackConnected}
          onConnect={handleConnectSlack}
          loading={loadingConversations}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <ChatArea messages={messages} isTyping={isTyping} />
          <InputArea
            onSendMessage={handleSendMessage}
            disabled={isTyping}
            speakEnabled={speakEnabled}
            onToggleSpeak={() => setSpeakEnabled(v => !v)}
            continuousMode={continuousMode}
            onToggleContinuous={() => setContinuousMode(v => !v)}
          />
        </div>
      </div>
      <SlackSettingsModal open={settingsOpen} onClose={() => { setSettingsOpen(false); checkSlackStatus(); }} />
    </div>
  );
}

export default App;