/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        'bg-base': '#080c14',
        'bg-card': '#132030',
        'bg-elevated': '#1e293b',
        'accent-primary': '#42C8F5',
        'accent-secondary': '#00D2FF',
        'accent-tertiary': '#AEEA00',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'success': '#AEEA00',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'border': 'rgba(255,255,255,0.07)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #42C8F5, #132030)',
        'card-gradient': 'linear-gradient(135deg, rgba(66,200,245,0.1), rgba(19,32,48,0.05))',
        'shiroko-gradient': 'linear-gradient(180deg, #132030 0%, #080c14 100%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'glow': '0 0 30px rgba(66,200,245,0.2)',
        'glow-sm': '0 0 15px rgba(66,200,245,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.3s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
