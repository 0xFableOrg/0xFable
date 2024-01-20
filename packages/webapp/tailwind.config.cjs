/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      cursor: {
        hover: 'url(/misc/hover_cursor.png), pointer',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["coffee"],
  },
}

module.exports = config
