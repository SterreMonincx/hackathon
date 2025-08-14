import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, VolumeX, Repeat } from 'lucide-react';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  speakEnabled?: boolean;
  onToggleSpeak?: () => void;
  continuousMode?: boolean;
  onToggleContinuous?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, disabled = false, speakEnabled = false, onToggleSpeak, continuousMode = false, onToggleContinuous }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const interimRef = useRef<string>('');
  const silenceTimeoutRef = useRef<number | null>(null);
  const lastSendTsRef = useRef<number>(0);
  const externallySpeakingRef = useRef<boolean>(false);
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

  const commitIfReady = () => {
    const now = Date.now();
    if (now - lastSendTsRef.current < 600) return;
    const phrase = (finalTranscriptRef.current + ' ' + interimRef.current).trim();
    if (phrase.length >= 2) {
      onSendMessage(phrase);
      lastSendTsRef.current = now;
      setInput('');
      finalTranscriptRef.current = '';
      interimRef.current = '';
    }
  };

  const scheduleSilenceCommit = () => {
    if (silenceTimeoutRef.current) window.clearTimeout(silenceTimeoutRef.current);
    silenceTimeoutRef.current = window.setTimeout(() => {
      commitIfReady();
      // In continuous mode we keep listening without toggling recording state
    }, 800);
  };

  const startRecording = () => {
    if (disabled) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      alert('Voice input not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;

      finalTranscriptRef.current = '';
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        interimRef.current = interimTranscript;
        const combined = (finalTranscriptRef.current + ' ' + interimTranscript).trim();
        setInput(combined);
        if (continuousMode) scheduleSilenceCommit();
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (continuousMode && !externallySpeakingRef.current) {
          // If engine stopped naturally, ensure we flush pending text on end
          commitIfReady();
        }
        setIsRecording(false);
        recognitionRef.current = null;
        if (continuousMode && !externallySpeakingRef.current) {
          // Restart listening automatically for hands-free mode
          setTimeout(() => {
            startRecording();
          }, 200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop?.();
    } finally {
      setIsRecording(false);
    }
  };

  // Auto start/stop when continuous mode toggles
  useEffect(() => {
    if (continuousMode && !isRecording) {
      startRecording();
    }
    if (!continuousMode && isRecording) {
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuousMode]);

  // Pause mic while assistant is speaking to avoid feedback
  useEffect(() => {
    const handler = (e: any) => {
      const speaking = Boolean(e?.detail?.speaking);
      externallySpeakingRef.current = speaking;
      if (speaking) {
        if (isRecording) stopRecording();
      } else if (continuousMode && !isRecording) {
        startRecording();
      }
    };
    window.addEventListener('assistant-speaking', handler as any);
    return () => window.removeEventListener('assistant-speaking', handler as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuousMode, isRecording]);

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
              {/* File button removed by request */}
              
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
                aria-pressed={isRecording}
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  isRecording
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title={isRecording ? 'Stop voice input' : 'Start voice input'}
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
              <button
                type="button"
                onClick={onToggleSpeak}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  speakEnabled
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title={speakEnabled ? 'Disable voice responses' : 'Enable voice responses'}
              >
                {speakEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={onToggleContinuous}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  continuousMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-purple-400 hover:text-purple-600 hover:bg-purple-50'
                }`}
                title={continuousMode ? 'Disable hands-free mode' : 'Enable hands-free mode'}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputArea;