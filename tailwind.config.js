/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './frontend/app/**/*.{js,ts,jsx,tsx,mdx}',
    './frontend/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tosnos: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
          950: '#0b0f19',
        },
        dark: {
          bg: '#090d16',
          card: '#111827',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.05)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        bengali: ['Noto Serif Bengali', 'Kalpurush', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-glow': 'orbGlow 3s ease-in-out infinite alternate',
        'waveform': 'waveform 1.2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        orbGlow: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 35px rgba(99, 102, 241, 0.4), inset 0 0 25px rgba(56, 189, 248, 0.3)' },
          '100%': { transform: 'scale(1.05)', boxShadow: '0 0 65px rgba(168, 85, 247, 0.6), inset 0 0 45px rgba(99, 102, 241, 0.5)' }
        },
        waveform: {
          '0%': { height: '15%' },
          '100%': { height: '95%' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
};
