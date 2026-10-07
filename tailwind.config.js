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
        mtn: {
          yellow: {
            DEFAULT: '#FFCC00', // Iconic MTN Yellow
            50: '#FFFDF0',
            100: '#FFF9D2',
            200: '#FFF3A3',
            300: '#FFEB75',
            400: '#FFE247',
            500: '#FFCC00', // Core brand yellow
            600: '#E5B700',
            700: '#B89200',
            800: '#8C6F00',
            900: '#5F4B00',
          },
          black: '#000000',
          dark: {
            DEFAULT: '#121212',
            50: '#2A2A2A',
            100: '#222222',
            200: '#1E1E1E',
            300: '#181818',
            400: '#141414',
            500: '#121212',
            800: '#0D0D0D',
            900: '#080808',
          },
          charcoal: '#1F2421',
          gray: {
            light: '#F8F9FA',
            border: '#E5E7EB',
            muted: '#6B7280',
          }
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'mtn-sm': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'mtn-md': '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)',
        'mtn-lg': '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)',
        'mtn-glow': '0 0 15px rgba(255, 204, 0, 0.35)',
      },
      borderRadius: {
        'mtn': '8px',
      }
    },
  },
  plugins: [],
}
