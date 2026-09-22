/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      screens: {
        "3xl": "1620px",
      },
      backgroundImage: {
        "custom-gradient":
          "linear-gradient(90deg, #2CD97D 0%, #34D399 50%, #4EFAAA 100%)",
        "custom-gradient-border":
          "linear-gradient(0deg, #2CD97D 0%, #34D399 50%, #4EFAAA 100%)",
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
      },
      colors: {
        "gradient-start": "#2CD97D",
        "gradient-middle": "#34D399",
        "gradient-end": "#4EFAAA",
        "cyber-primary": "#2CD97D",
        "cyber-accent": "#34D399",
        "cyber-neon": "#4EFAAA",
        "cyber-dark": "#050811",
      },
    },
  },
  plugins: [],
};
