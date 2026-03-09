/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f3', 100: '#ffe4e8',
          400: '#f0607a', 500: '#e94560', 600: '#d63650', 700: '#b82d42',
        },
        dark: {
          900: '#060610', 800: '#0d0d1f', 700: '#161628', 600: '#1e1e35',
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'slide-up': { from: { opacity: '0', transform: 'translateY(40px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'slide-up': 'slide-up 0.6s ease forwards',
      }
    },
  },
  plugins: [],
}
