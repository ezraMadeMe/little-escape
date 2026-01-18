/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Colors - 눈이 편안한 다크 모드
        'deep-charcoal': '#121212',
        'charcoal-soft': '#1A1A1A',
        'charcoal-lighter': '#242424',

        // Primary Colors - 힙하고 도파민 터지는 느낌
        'electric-lime': '#CCFF00',
        'electric-lime-dark': '#A3CC00',
        'neon-purple': '#B026FF',
        'neon-purple-dark': '#8C1FCC',

        // Text Colors
        'off-white': '#EDEDED',
        'text-gray': '#A0A0A0',
        'text-gray-dark': '#707070',

        // Accent Colors
        'accent-pink': '#FF007A',
        'accent-cyan': '#00F0FF',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
      fontWeight: {
        'extra-bold': '800',
        'black': '900',
      },
      borderRadius: {
        'solotion': '12px', // 독특한 각진 형태
        'solotion-sm': '8px',
        'solotion-lg': '16px',
      },
      boxShadow: {
        'neon-lime': '0 0 20px rgba(204, 255, 0, 0.4)',
        'neon-purple': '0 0 20px rgba(176, 38, 255, 0.4)',
        'solotion': '0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
