import React from "react";
import cx from "classnames";

export default function Welcome() {
    const links = [
        { label: "Website", url: "https://baltha.studio", icon: "🌐" },
        { label: "Instagram", url: "https://instagram.com/baltha.studio", icon: "📸" },
        { label: "Email", url: "mailto:hello@baltha.studio", icon: "✉️" },
        { label: "WhatsApp", url: "https://wa.me/", icon: "💬" },
    ];

    return (
        <div className="min-h-[100dvh] w-full bg-[#9A92D2] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background decorative elements if needed, for now solid color is fine or maybe a gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#9A92D2] to-[#7583ff] opacity-50 pointer-events-none" />

            <div className="w-full max-w-md bg-[#F4F2ED] rounded-[32px] p-6 md:p-8 shadow-2xl relative z-10 transform transition-all hover:scale-[1.01] duration-500">
                <div className="flex justify-between items-start mb-8">
                    <img
                        src="/assets/brand/Baltha_Studio_Icon_Blue.png"
                        alt="Baltha Studio"
                        className="h-10 md:h-12"
                        style={{
                            filter: 'invert(3%) sepia(82%) saturate(500%) hue-rotate(201deg) brightness(102%) contrast(94%)'
                        }}
                    />
                </div>

                <h1 className="font-ballinger-condensed font-extrabold text-[32px] md:text-[40px] leading-[1.1] text-[#081529] mb-10 tracking-tight">
                    Placeholder link tree.
                </h1>

                <div className="space-y-4">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block w-full bg-white hover:bg-[#081529] transition-all duration-300 rounded-2xl p-5 text-[#081529] hover:text-white font-bold text-xl flex items-center justify-between shadow-sm hover:shadow-lg border border-transparent hover:border-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{link.icon}</span>
                                <span>{link.label}</span>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">↗</span>
                        </a>
                    ))}
                </div>
            </div>

            <div className="mt-12 text-[#081529] font-mono text-xs tracking-widest opacity-60 relative z-10 mix-blend-overlay">
                BALTHA STUDIO 2025
            </div>
        </div>
    );
}
