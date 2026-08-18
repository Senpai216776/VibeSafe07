/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safety: {
          red: '#EF4444',
          darkred: '#991B1B',
          amber: '#F59E0B',
          green: '#10B981',
          blue: '#3B82F6',
          dark: '#0B0F19',
          surface: '#111827',
          card: '#1F2937',
          border: '#374151',
          accent: '#6366F1',
        },
      },
      animation: {
        'radar-pulse': 'radar-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'fast-pulse': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'radar-pulse': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.7)' },
          '50%': { boxShadow: '0 0 35px rgba(239, 68, 68, 1)' },
        },
      },
    },
  },
  plugins: [],
}
