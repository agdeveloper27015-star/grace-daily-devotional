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
        sans: ['Source Sans 3', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
        reading: ['Literata', 'serif'],
      },
      colors: {
        'grace-bg': 'var(--bg-page)',
        'grace-surface': 'var(--bg-surface-1)',
        'grace-surface-2': 'var(--bg-surface-2)',
        'grace-surface-3': 'var(--bg-surface-3)',
        'grace-border': 'var(--border-default)',
        'terra': 'var(--accent)',
        'terra-light': 'var(--accent-soft)',
        'terra-dark': 'var(--accent-deep)',
        'highlight-yellow': 'var(--highlight-yellow)',
        'highlight-green': 'var(--highlight-green)',
        'highlight-blue': 'var(--highlight-blue)',
        'highlight-pink': 'var(--highlight-pink)',
        'highlight-orange': 'var(--highlight-orange)',
        'cream': 'var(--fg-primary)',
        'cream-dark': 'var(--fg-secondary)',
        'cream-muted': 'var(--fg-muted)',
        'grace-muted': 'var(--fg-subtle)',
      },
    },
  },
  plugins: [],
};
