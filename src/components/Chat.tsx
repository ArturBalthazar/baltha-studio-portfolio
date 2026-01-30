import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { useUI, S } from "../state";
import { useI18n } from "../i18n";

interface ChatAction {
  label: string;
  type: 'whatsapp' | 'email' | 'linkedin' | 'instagram' | 'home';
}

interface Message {
  id: string;
  text: string;
  type: "user" | "bot";
  timestamp: Date;
  actions?: ChatAction[];
}

// Context data sent with each message for more contextual AI responses
interface ChatContext {
  state: number;                          // Current state (0-7, 99=final)
  navMode: 'guided' | 'free';             // Navigation mode
  workplaceVisible: boolean;              // Workplace panel visible
  workplaceState?: number;                // Active workplace state (which anchor ship is near)
  projectIndex?: number;                  // Selected project index within current workplace
}

interface ChatProps {
  className?: string;
  onClose?: () => void;
}

// Generate a unique session ID for this page load (resets on reload)
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Store session ID at module level so it persists during the session but resets on page reload
let sessionId: string | null = null;
const getSessionId = () => {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
};

// Store messages at module level so they persist when chat is closed and reopened
// (component unmounts but messages stay in memory until page reload)
let persistedMessages: Message[] = [];

export function Chat({ className = "", onClose }: ChatProps) {
  // Initialize from persisted messages so chat history survives close/reopen
  const [messages, setMessages] = useState<Message[]>(persistedMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionsDisplayed, setSuggestionsDisplayed] = useState(persistedMessages.length > 0);
  const [isAnimating, setIsAnimating] = useState(true); // Start closed for entrance animation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync messages to module-level storage whenever they change
  React.useEffect(() => {
    persistedMessages = messages;
  }, [messages]);

  // Subscribe to state for context
  const state = useUI((st) => st.state);
  const navigationMode = useUI((st) => st.navigationMode);
  const workplacePanelVisible = useUI((st) => st.workplacePanelVisible);
  const selectedProjectIndex = useUI((st) => st.selectedProjectIndex);
  const activeWorkplaceState = useUI((st) => st.activeWorkplaceState);

  // Build context object for the current state
  const buildContext = (): ChatContext => {
    return {
      state: state === S.state_final ? 99 : state,
      navMode: navigationMode,
      workplaceVisible: workplacePanelVisible,
      workplaceState: activeWorkplaceState !== null ? activeWorkplaceState : undefined,
      projectIndex: workplacePanelVisible ? selectedProjectIndex : undefined,
    };
  };

  // Get translations
  const { t } = useI18n();

  const suggestions = [
    t.chat.suggestion1,
    t.chat.suggestion2,
    t.chat.suggestion3,
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!suggestionsDisplayed) setSuggestionsDisplayed(true);

    // Entrance animation - small delay then open
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const formatMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  };

  const addMessage = (text: string, type: "user" | "bot", actions?: ChatAction[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
      actions,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // Parse actions from bot response: [ACTIONS][{"label":"...","type":"..."}][/ACTIONS]
  const parseResponse = (response: string): { text: string; actions?: ChatAction[] } => {
    const match = response.match(/\[ACTIONS\](.*?)\[\/ACTIONS\]/s);
    if (match) {
      try {
        const actions = JSON.parse(match[1]) as ChatAction[];
        const text = response.replace(/\[ACTIONS\].*?\[\/ACTIONS\]/s, '').trim();
        return { text, actions };
      } catch { return { text: response }; }
    }
    return { text: response };
  };

  // Action handlers
  const handleAction = (action: ChatAction) => {
    switch (action.type) {
      case 'whatsapp':
        window.open('https://wa.me/554891287795?text=Hello%2C%20I%27d%20like%20to%20get%20in%20touch%21', '_blank');
        break;
      case 'email':
        window.location.href = 'mailto:artur@baltha.studio';
        break;
      case 'linkedin':
        window.open('https://www.linkedin.com/in/artur-balthazar/', '_blank');
        break;
      case 'instagram':
        window.open('https://instagram.com/baltha.studio', '_blank');
        break;
      case 'home':
        useUI.getState().setNavigationMode('guided');
        useUI.getState().setState(S.state_0);
        break;
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    addMessage(message, "user");
    setInputValue("");
    setIsTyping(true);

    try {
      const BASE_URL =
        window.location.hostname === "localhost"
          ? "http://127.0.0.1:8081"
          : "https://baltha-studio-v2.onrender.com";

      const response = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, userId: getSessionId(), context: buildContext() }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const { text, actions } = parseResponse(data.response);
      addMessage(text, "bot", actions);
    } catch (error) {
      console.error("Error:", error);
      addMessage(t.chat.errorMessage, "bot");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 60)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleClose = () => {
    setIsAnimating(true); // Start close animation 
    onClose?.(); // Trigger parent state change immediately so header/canvas animate
    // Chat component will be removed by parent after 500ms
  };


  return (
    <div
      className={cx(
        "fixed z-50 right-4 left-4 transition-all duration-500",
        // Mobile: animate top position and opacity
        isAnimating ? "top-[calc(68px+50%)] opacity-0" : "top-[calc(68px+0%)] opacity-100",
        // Desktop: animate width and opacity, keep top fixed
        "md:right-4 md:left-auto md:top-4 md:z-[60] md:w-[calc(25%-24px)]",
        isAnimating ? "md:translate-x-[50%] md:opacity-0" : "md:translate-x-[0%] md:opacity-100",

        // MOBILE vs DESKTOP values for the top offset
        "[--chat-top:84px] md:[--chat-top:32px]",
        className
      )}
      // Use HEIGHT based on --app-vh so it shrinks with the keyboard (like the canvas)
      style={{
        height:
          "calc(var(--app-vh, 100dvh) - var(--chat-top) - max(env(safe-area-inset-bottom,0px), 16px))",
      }}
    >
      {/* === EXACT-SIZE BOX BEHIND THE CHAT WINDOW === */}
      <div
        className="absolute z-0 rounded-bigButton -inset-1 pointer-events-none animate-pulse-rect"
        style={{
          background:
            "linear-gradient(180deg,rgba(155,146,210,0.9) 0%,rgba(255,153,204,0.8) 70%,rgba(255,136,0,0.5) 100%)",
          filter: "blur(6px)",
        }}
      />

      {/* Chat container (above the background box) */}
      <div
        className={cx(
          "relative z-10",
          "bg-brand-white/80 backdrop-blur-sm rounded-bigButton shadow-hero",
          "md:bg-brand-white/80 md:rounded-canvas",
          "flex flex-col overflow-hidden w-full h-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center bg-brand-dark font-helvetica text-white p-2 rounded-t-bigButton md:rounded-t-canvas">
          <img
            src="/assets/images/chatbot_avatar.jpg"
            alt="Artur Balthazar"
            className="w-10 h-10 rounded-full border-[3px] border-white mr-3"
          />
          <div className="flex-1">
            <div className="font-bold">{t.chat.headerTitle}</div>
            <div className="text-sm opacity-90">{t.chat.headerSubtitle}</div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-white/80 text-lg font-bold w-6 h-6 flex -mt-3"
          >
            <img src="/assets/images/close.png" alt="Close" className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {messages.length === 0 &&
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block mx-auto bg-gray-100 hover:bg-gray-200 text-gray-600 font-helvetica text-sm px-3 py-2 rounded-bigButton border border-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cx(
                "flex",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.type === "bot" && (
                <img
                  src="/assets/images/chatbot_avatar.jpg"
                  alt="Artur"
                  className="w-8 h-8 rounded-full border-2 border-white mr-2 flex-shrink-0"
                />
              )}
              <div
                className={cx(
                  "max-w-[80%] px-3 py-2 rounded-bigButton font-helvetica text-sm",
                  message.type === "user"
                    ? "bg-brand-dark/80 text-white ml-auto"
                    : "bg-gray-200 text-gray-800 border border-gray-300"
                )}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }}
                />
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-300">
                    {message.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        className="px-2.5 py-1 text-xs bg-brand-dark/80 text-white rounded-lg hover:bg-brand-dark transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <img
                src="/assets/images/chatbot_avatar.jpg"
                alt="Artur"
                className="w-8 h-8 rounded-full border-2 border-white mr-2 flex-shrink-0"
              />
              <div className="bg-gray-200 text-gray-800 px-2 py-3 rounded-bigButton border border-gray-300 text-sm">
                <div className="flex space-x-[3px]">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-high" />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-high"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-high"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>

              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-gray-50 pl-3 pt-2 pb-1 rounded-b-bigButton ">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.chat.placeholder}
            className="w-full resize-none border-0 outline-none bg-transparent font-mono text-xs text-brand-dark/70 max-h-[60px] overflow-y-auto leading-5"
            rows={1}
            style={{ minHeight: "10px" }}
          />
        </div>
      </div>
    </div>
  );
}
