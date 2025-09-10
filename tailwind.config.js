/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // keep the simple tokens you already use (e.g. bg-card, text-ink)
        ink: "#081529",
        card: "#F4F2ED",
        // add a namespaced brand palette => text-brand-*, bg-brand-*, border-brand-*
        brand: {
          ink:   "#081529",
          card:  "#F4F2ED",
          purple:"#49408D",
          dark:  "#081428",
          orange:"#FF8800",
          lilac: "#9A92D2",
          pink:  "#FF99CC",
          white: "#F5F2ED", // note: this is slightly off-white; change to #FFFFFF if you need pure white
        },
      },
      borderRadius: {
        hero: "22px",
        canvas: "16px",
        bigButton: "10px",
        smallButton: "5px",
      },
      boxShadow: {
        hero: "0 6px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
