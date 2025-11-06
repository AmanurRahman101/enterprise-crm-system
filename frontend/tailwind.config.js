/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Teal (#224041) - Primary Brand Color
        primary: {
          50: '#f0f5f5',
          100: '#d9e5e5',
          200: '#b3cbcc',
          300: '#8db1b2',
          400: '#679799',
          500: '#417d7f',
          600: '#336466',
          700: '#224041',  // Deep Teal
          800: '#1a3031',  // Darker Teal
          900: '#112021',
        },
        // Warm Amber - Secondary Accent Color for CTAs
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Warm Amber/Gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [],
}
