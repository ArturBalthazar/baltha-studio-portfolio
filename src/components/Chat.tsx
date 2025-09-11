import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";

interface Message {
  id: string;
  text: string;
  type: "user" | "bot";
  timestamp: Date;
}

interface ChatProps {
  className?: string;
  onClose?: () => void;
}

export function Chat({ className = "", onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionsDisplayed, setSuggestionsDisplayed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = [
    "What's your professional background?",
    "What tools and technologies do you work with?",
    "How can I get in touch with you?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!suggestionsDisplayed) setSuggestionsDisplayed(true);
  }, []);

  const formatMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  };

  const addMessage = (text: string, type: "user" | "bot") => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
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
          : "https://baltha-studio.onrender.com";

      const response = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      addMessage(data.response, "bot");
    } catch (error) {
      console.error("Error:", error);
      addMessage("Oops! Something went wrong.", "bot");
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

  return (
      <div
        className={cx(
          "fixed z-50 right-4 left-4 top-[68px]",
          "md:right-4 md:left-auto md:w-[calc(25%-24px)] md:top-4 md:z-[60]",

          // MOBILE vs DESKTOP values for the top offset
          "[--chat-top:68px] md:[--chat-top:16px]",
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
          "bg-brand-white backdrop-blur-sm rounded-bigButton shadow-hero",
          "md:bg-brand-white md:rounded-canvas",
          "flex flex-col overflow-hidden w-full h-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center bg-brand-dark font-sans text-white p-2 rounded-t-bigButton md:rounded-t-canvas">
          <img
            src="/assets/images/chatbot_avatar.jpg"
            alt="Artur Balthazar"
            className="w-10 h-10 rounded-full border-[3px] border-white mr-3"
          />
          <div className="flex-1">
            <div className="font-bold font-sans">Artur Balthazar</div>
            <div className="text-sm opacity-90">Director at Baltha Studio</div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 text-lg font-bold w-6 h-6 flex items-center justify-center"
          >
            <img src="/assets/images/close.png" alt="Close" className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 &&
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm px-3 py-2 rounded-bigButton border border-gray-300 transition-colors"
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
                  "max-w-[80%] px-3 py-2 rounded-bigButton text-sm",
                  message.type === "user"
                    ? "bg-brand-dark/80 text-white ml-auto"
                    : "bg-gray-200 text-gray-800 border border-gray-300"
                )}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }}
                />
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
              <div className="bg-gray-200 text-gray-800 px-3 py-3 rounded-bigButton border border-gray-300 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
            placeholder="Type your message here..."
            className="w-full resize-none border-0 outline-none bg-transparent font-mono text-xs text-brand-dark/70 max-h-[60px] overflow-y-auto leading-5"
            rows={1}
            style={{ minHeight: "20px" }}
          />
        </div>
      </div>
    </div>
  );
}
