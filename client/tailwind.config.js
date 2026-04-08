/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A2E',
        accent: '#E86B2E',
        surface: '#F7F6F2',
        success: '#2D7D46',
        warning: '#C9801A',
        danger: '#C0392B',
        muted: '#6B7280',
        border: '#E5E2DC',
        card: '#FFFFFF',
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
