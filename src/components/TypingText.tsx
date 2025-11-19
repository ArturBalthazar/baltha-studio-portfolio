import React, { useState, useEffect, useRef } from 'react';

interface TypingTextProps {
  text: string;
  startDelay?: number;
  typingSpeed?: number;
  className?: string;
}

export function TypingText({
  text,
  startDelay = 0,
  typingSpeed = 25,
  className = ""
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText("");
    setIsTyping(false);

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing after delay
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(true);

      let index = 0;
      const typeCharacter = () => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
          typingTimeoutRef.current = setTimeout(typeCharacter, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };

      typeCharacter();
    }, startDelay);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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
    <div className={`font-mono pointer-events-none select-none ${className}`}>
      <span className="typing-content select-none">{displayedText}</span>
      <span
        className={`inline-block transition-opacity duration-100 select-none ${cursorVisible ? 'opacity-100' : 'opacity-0'
          }`}
      >
        ▌
      </span>
    </div>
  );
}
