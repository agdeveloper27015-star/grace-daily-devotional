/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './**/*.{ts,tsx}',
    '!./node_modules/**',
    '!./dist/**',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        reading: ['Merriweather', 'serif'],
      },
      colors: {
        'grace-bg': '#0A0A0A',
        'grace-surface': '#141414',
        'grace-surface-2': '#1E1E1E',
        'grace-surface-3': '#282828',
        'grace-border': '#2E2E2E',
        'terra': '#FFFFFF',
        'terra-light': '#E0E0E0',
        'terra-dark': '#BFBFBF',
        'highlight-yellow': '#FACC15',
        'highlight-green': '#4ADE80',
        'highlight-blue': '#60A5FA',
        'highlight-pink': '#FB7185',
        'highlight-orange': '#E8945A',
        'cream': '#F0F0F0',
        'cream-dark': '#D4D4D4',
        'cream-muted': '#808080',
        'grace-muted': '#505050',
      },
    },
  },
  plugins: [],
};
