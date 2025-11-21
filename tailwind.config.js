/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        helvetica: ['Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          purple: "#49408D",
          dark: "#081428",
          orange: "#FF8800",
          lilac: "#9A92D2",
          pink: "#FF99CC",
          white: "#F5F2ED",
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
      keyframes: {
        'bounce-high': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      animation: {
        'bounce-high': 'bounce-high 0.6s infinite',
      },
    },
  },
  plugins: [],
};
