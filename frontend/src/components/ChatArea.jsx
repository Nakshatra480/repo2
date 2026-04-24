import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PromptBox } from './PromptBox';

export default function ChatArea({ activeThreadId, fetchThreads }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + text);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleListening = () => {
    if (!recognition) return alert('Your browser does not support speech recognition.');
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return alert('Your browser does not support text to speech.');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (activeThreadId) {
      fetchMessages(activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchMessages = async (threadId) => {
    try {
      const res = await axios.get(`/api/chat/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText?.trim() || !activeThreadId) return;

    const userMsg = { _id: Date.now().toString(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await axios.post(`/api/chat/threads/${activeThreadId}/messages`, {
        content: userMsg.content
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg.role === 'user' && lastMsg._id === userMsg._id) {
          return [...newMsgs.slice(0, -1), res.data.userMessage, res.data.assistantMessage];
        }
        return [...newMsgs, res.data.userMessage, res.data.assistantMessage];
      });
      fetchThreads(); // Refresh thread titles if needed
    } catch (error) {
      console.error('Failed to send message', error);
      alert('Error sending message');
    } finally {
      setIsTyping(false);
    }
  };


  if (!activeThreadId) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <h2>Welcome to Mind Assistant</h2>
          <p>Select a conversation from the sidebar or start a new one to begin. I am here to help you gain clarity and sort through your thoughts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>How are you feeling today?</h2>
            <p>Share what's on your mind. Whether you're feeling stuck, confused, or just need someone to talk to, I'm here to listen and help you find clarity.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg._id} className={`message ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'assistant' ? 'A' : 'U'}
              </div>
              <div className="message-content text-gray-200">
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-4 leading-relaxed last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 last:mb-0" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 last:mb-0" {...props} />,
                        li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)
                )}
                
                {msg.role === 'assistant' && (
                  <button onClick={() => speakText(msg.content)} className="flex items-center gap-1.5 mt-3 text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                    <Volume2 size={14} /> <span className="text-xs font-medium">Listen</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="message assistant">
            <div className="avatar">A</div>
            <div className="message-content" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area max-w-[850px] mx-auto w-full mb-8 px-4">
        <PromptBox 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={sendMessage}
          isListening={isListening}
          toggleListening={toggleListening}
        />
      </div>
    </div>
  );
}
