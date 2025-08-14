import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, disabled = false }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // 5 lines approximately
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      setTimeout(adjustTextareaHeight, 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const placeholderTexts = [
    "Ask me about your Slack messages...",
    "What's the latest from the team?",
    "Summarize today's discussions...",
    "Find messages about the project...",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border-t border-purple-100 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`flex items-end space-x-4 bg-white border-2 rounded-2xl transition-all duration-300 ${
            isFocused 
              ? 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 p-0.5' 
              : 'border-purple-100 hover:border-purple-200'
          }`}>
            <div className={`flex items-end space-x-4 w-full ${
              isFocused ? 'bg-white rounded-2xl p-4' : 'p-4'
            }`}>
              <button
                type="button"
                className="flex-shrink-0 p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 min-h-[40px] flex items-center">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={placeholderTexts[placeholderIndex]}
                  disabled={disabled}
                  className="w-full resize-none bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-sm leading-6 min-h-[24px] max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent"
                  rows={1}
                  style={{ fieldSizing: 'content' } as any}
                />
              </div>

              <button
                type="button"
                className="flex-shrink-0 p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 ${
                  input.trim() && !disabled
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputArea;