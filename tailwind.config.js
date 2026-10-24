/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1F3A5F',
        azul: '#2E5C8A',
        naranja: '#D35400',
        rojo: '#C0392B',
        verde: '#1E8449',
        fondo: '#EAF1F8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.85)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '75%': { transform: 'translateX(3px)' },
        },
        flow: { '0%': { left: '0%' }, '100%': { left: '100%' } },
      },
      animation: {
        pop: 'pop .35s ease-out both',
        shake: 'shake .12s linear infinite',
        flow: 'flow 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};
