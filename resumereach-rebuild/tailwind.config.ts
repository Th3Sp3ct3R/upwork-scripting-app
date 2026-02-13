import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f6ff',
          100: '#e0ecff',
          200: '#c7deff',
          300: '#a3cdff',
          400: '#7ab1ff',
          500: '#0066ff', // Primary blue
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001a33',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
