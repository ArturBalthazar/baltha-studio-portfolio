import React, { useState, useRef, useEffect } from "react";
import cx from "classnames";
import { useI18n, LanguageCode } from "../i18n";
import { playShortClick } from "./ClickSoundManager";

interface Language {
    code: LanguageCode;
    label: string;
    icon: string;
}

const LANGUAGES: Language[] = [
    { code: "EN", label: "English", icon: "/assets/images/english.png" },
    { code: "PT", label: "Português", icon: "/assets/images/portuguese.png" },
    { code: "ES", label: "Español", icon: "/assets/images/spanish.png" },
    { code: "DE", label: "Deutsch", icon: "/assets/images/german.png" },
    { code: "FR", label: "Français", icon: "/assets/images/french.png" },
    { code: "ZH", label: "中文", icon: "/assets/images/chinese.png" },
];

interface LanguageSelectorProps {
    visible: boolean;
    isWhite?: boolean;
    isLarge?: boolean;
}

export function LanguageSelector({ visible, isWhite = false, isLarge = false }: LanguageSelectorProps) {
    const { language, setLanguage } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get the currently selected language object
    const selectedLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Close dropdown when visibility changes (menu closes)
    useEffect(() => {
        if (!visible) {
            setIsOpen(false);
        }
    }, [visible]);

    const handleLanguageSelect = (lang: Language) => {
        playShortClick();
        setLanguage(lang.code);
        setIsOpen(false);
    };

    return (
        <div
            ref={dropdownRef}
            className={cx(
                "relative z-50 transition-all duration-300",
                visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
        >
            {/* Toggle Button - Pill shape similar to navigation toggle */}
            <button
                onClick={() => { playShortClick(); setIsOpen(!isOpen); }}
                className={cx(
                    "relative flex items-center gap-1 rounded-[25px]",
                    "backdrop-blur-[10px]",
                    "transition-all duration-500 hover:scale-[1.02]",
                    "cursor-pointer overflow-hidden",
                    // Size variants based on isLarge
                    isLarge
                        ? "h-[36px] sm:h-[36px] pl-[4px] pr-[10px] sm:pr-[12px]"
                        : "h-[30px] sm:h-[34px] pl-[3px] pr-[8px] sm:pr-[10px]"
                )}
                style={{
                    backgroundColor: '#08142801',
                    boxShadow: isWhite
                        ? 'inset 0 0 1px 1px rgba(255,255,255,0.45)'
                        : 'inset 0 0 0 1.5px #081529'
                }}
                aria-label="Select language"
                aria-expanded={isOpen}
            >
                {/* Flag Icon in circular container */}
                <div
                    className={cx(
                        "rounded-full",
                        "flex items-center justify-center",
                        "shadow-[inset_0_0_4px_3px_rgba(255,255,255,0.45)]",
                        "transition-all duration-500 overflow-hidden",
                        // Size variants based on isLarge
                        isLarge
                            ? "w-[28px] h-[28px] sm:w-[30px] sm:h-[30px]"
                            : "w-[24px] h-[24px] sm:w-[28px] sm:h-[28px]"
                    )}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                >
                    <img
                        src={selectedLanguage.icon}
                        alt={selectedLanguage.label}
                        className="w-full h-full sm:w-full sm:h-full object-cover rounded-full"
                        draggable={false}
                    />
                </div>

                {/* Arrow Icon */}
                <svg
                    className={cx(
                        "transition-all duration-500",
                        isOpen && "rotate-180",
                        // Size variants based on isLarge
                        isLarge
                            ? "w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]"
                            : "w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]"
                    )}
                    style={{
                        color: isWhite ? 'rgba(255,255,255,0.8)' : '#081529'
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Dropdown Menu */}
            <div
                className={cx(
                    "absolute mt-2 min-w-[60px] sm:min-w-[80px] rounded-[16px] sm:rounded-[20px]",
                    "bg-brand-dark/70 backdrop-blur-[6px] z-60",
                    "shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.45)]",
                    "overflow-hidden transition-all duration-300 origin-top",
                    isOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none",
                    isLarge
                        ? "-left-2"
                        : "-left-3"
                )}
            >
                {/* Dropdown Items */}
                {LANGUAGES.map((language) => {
                    const isSelected = language.code === selectedLanguage.code;
                    return (
                        <button
                            key={language.code}
                            onClick={() => handleLanguageSelect(language)}
                            className={cx(
                                "w-full flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5",
                                "transition-all duration-200 z-100000",
                                "hover:bg-white/10",
                                isSelected && "bg-white/25"
                            )}
                        >
                            {/* Flag Icon */}
                            <img
                                src={language.icon}
                                alt={language.label}
                                className="w-[28px] h-[28px] sm:w-[28px] sm:h-[28px] object-cover rounded-full flex-shrink-0"
                                draggable={false}
                            />

                            {/* Language Code */}
                            <span
                                className={cx(
                                    "font-mono text-sm sm:text-base transition-colors duration-200",
                                    isSelected ? "text-white" : "text-white/70"
                                )}
                            >
                                {language.code}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
