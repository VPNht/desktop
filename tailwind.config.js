/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vpn: {
          primary: '#3B82F6',
          secondary: '#10B981',
          danger: '#EF4444',
          dark: '#1F2937',
          darker: '#111827',
        }
      }
    },
  },
  plugins: [],
}
