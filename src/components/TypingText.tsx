import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  startDelay?: number;
  typingSpeed?: number;
  className?: string;
}

export function TypingText({ 
  text, 
  startDelay = 500, 
  typingSpeed = 25, 
  className = "" 
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setIsTyping(false);

    // Start typing after delay
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      
      let index = 0;
      const typeCharacter = () => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
          setTimeout(typeCharacter, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };
      
      typeCharacter();
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
    };
  }, [text, startDelay, typingSpeed]);

  // Cursor blinking effect - always active
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530); // Blink every 530ms

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className={`font-mono ${className}`}>
      <span className="typing-content">{displayedText}</span>
      <span 
        className={`inline-block transition-opacity duration-100 ${
          cursorVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ▌
      </span>
    </div>
  );
}
