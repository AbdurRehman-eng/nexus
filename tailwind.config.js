/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-red': '#5A0F0F',
        'maroon': '#7A1A1A',
        'chat-bg': '#FAFAFA',
        'gray-border': '#E0E0E0',
        'light-gray': '#F5F5F7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 2px 10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'card': '8px',
        'input': '6px',
        'button': '6px',
      },
    },
  },
  plugins: [],
}