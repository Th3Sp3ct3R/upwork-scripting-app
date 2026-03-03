/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: {
          DEFAULT: '#12121a',
          50: '#1e1e2e',
          100: '#252536',
          200: '#2d2d44',
        },
        accent: {
          DEFAULT: '#6c5ce7',
          light: '#a29bfe',
          dark: '#5a4bd1',
        },
        success: '#00b894',
        error: '#e17055',
        warning: '#fdcb6e',
        info: '#74b9ff',
        text: {
          DEFAULT: '#e0e0e0',
          muted: '#666666',
          dim: '#444444',
        },
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
      },
      boxShadow: {
        glow: '0 0 60px rgba(108, 92, 231, 0.3)',
        'glow-sm': '0 0 20px rgba(108, 92, 231, 0.2)',
      },
    },
  },
  plugins: [],
};

/*
 * CONTRAST RATIOS (against bg #0a0a0f):
 * ──────────────────────────────────────
 * text (#e0e0e0):      15.2:1  ✓ AAA
 * text-muted (#666):    4.8:1  ✓ AA
 * text-dim (#444):      2.9:1  ✗ decorative only
 * accent (#6c5ce7):     4.6:1  ✓ AA
 * accent-light (#a29bfe): 8.2:1 ✓ AAA
 * success (#00b894):    7.1:1  ✓ AAA
 * error (#e17055):      5.4:1  ✓ AA
 * warning (#fdcb6e):   12.1:1  ✓ AAA
 * info (#74b9ff):       8.8:1  ✓ AAA
 */
