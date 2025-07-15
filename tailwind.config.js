/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#E3E9F7',
        card: '#F8F8FF',
        accent: '#8FB8DE',
        text: '#2E3A59',
        interactive: '#93F6D0',
        premium: '#F5BE7A',
      },
      borderRadius: {
        'glass': '16px',
      },
      backdropBlur: {
        'glass': '8px',
      },
    },
  },
  plugins: [],
}

