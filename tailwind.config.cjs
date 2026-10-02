/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:   { DEFAULT: '#16202E', soft: '#3A4859', faint: '#7A8797' },
        paper: { DEFAULT: '#FBFAF7', rule: '#E3E0D8', panel: '#FFFFFF' },
        crate: { DEFAULT: '#C17A1F', soft: '#F4E6CE' },
        sage:  { DEFAULT: '#3F7256', soft: '#E4EFE7' },
        clay:  { DEFAULT: '#A33B2A', soft: '#F7E3DF' },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        num:  ['"SF Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      },
    },
  },
  plugins: [],
};
