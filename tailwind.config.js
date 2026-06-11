/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F4FB',
          100: '#C5E0F2',
          200: '#9CC8E8',
          300: '#6BADD9',
          400: '#3D91C9',
          500: '#1E3A5F',
          600: '#182E4C',
          700: '#122339',
          800: '#0C1726',
          900: '#060B13',
        },
        accent: {
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#00B8D4',
          600: '#0097A7',
          700: '#00838F',
          800: '#006064',
          900: '#004044',
        },
        success: {
          50: '#E8F5E9',
          500: '#00C853',
          600: '#00A844',
        },
        warning: {
          50: '#FFF3E0',
          500: '#FF9100',
          600: '#E68200',
        },
        danger: {
          50: '#FFEBEE',
          500: '#FF5252',
          600: '#E04848',
        },
        neutral: {
          50: '#F5F7FA',
          100: '#EEF1F6',
          200: '#D8DEE9',
          300: '#B8C0CC',
          400: '#8892A6',
          500: '#4A4A6A',
          600: '#3A3A54',
          700: '#2A2A40',
          800: '#1A1A2E',
          900: '#0F0F1A',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Han Sans CN"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(30, 58, 95, 0.08), 0 8px 24px -8px rgba(30, 58, 95, 0.12)',
        'card-hover': '0 8px 16px -4px rgba(30, 58, 95, 0.12), 0 20px 40px -12px rgba(30, 58, 95, 0.18)',
        'glow': '0 0 24px rgba(0, 184, 212, 0.35)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00B8D4 0%, #0097A7 100%)',
        'gradient-danger': 'linear-gradient(135deg, #FF5252 0%, #E53935 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(245,247,250,0.8) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.35s ease-out forwards',
        'pulse-once': 'pulseOnce 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseOnce: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
