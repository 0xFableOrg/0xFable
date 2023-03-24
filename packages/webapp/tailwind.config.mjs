/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [import("daisyui")],
  daisyui: {
    themes: ["coffee"],
  },
}