/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nordic: {
          bg:       '#F7F6F3',
          surface:  '#FFFFFF',
          border:   '#E2E8F0',
          text:     '#2D3748',
          muted:    '#718096',
          sage:     '#7C9082', // Green/Success
          dusty:    '#7A8B99', // Blue/Info
          mustard:  '#D4A373', // Amber/Warning
          terra:    '#C88272', // Red/Danger
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
        'soft-lg': '0 20px 60px -15px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.03)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
