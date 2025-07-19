/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'us-blue': '#18333A',
        'us-red': '#B22234',
        'us-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}

