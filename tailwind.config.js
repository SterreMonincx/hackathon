/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        purple: {
          25: '#fefbff',
          50: '#f8f4ff',
          100: '#f0e6ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c2d92',
          800: '#6b21b6',
          900: '#581c87',
        }
      },
      animation: {
        'slideIn': 'slideIn 0.3s ease-out forwards',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        }
      },
      maxWidth: {
        '4xl': '56rem',
      },
      height: {
        '15': '3.75rem',
      }
    },
  },
  plugins: [],
};