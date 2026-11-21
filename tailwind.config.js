/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/web/**/*.{ts,tsx}', './src/data/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sakhi: {
          ink: 'hsl(var(--ink))',
          muted: 'hsl(var(--muted))',
          background: 'hsl(var(--background))',
          surface: 'hsl(var(--surface))',
          border: 'hsl(var(--border))',
          rose: 'hsl(var(--rose))',
          lavender: 'hsl(var(--lavender))',
        },
      },
      borderRadius: {
        sakhi: '1.25rem',
      },
      boxShadow: {
        card: '0 12px 40px -28px hsl(var(--ink) / 0.22)',
      },
    },
  },
  plugins: [],
};
