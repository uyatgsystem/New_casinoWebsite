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
          "linear-gradient(90deg,#4D4434 0.96%,#FE8912 49.52%,#4D4434 100%)",
        "custom-gradient-border":
          "linear-gradient(0deg,#4D4434 0.96%,#FE8912 49.52%,#4D4434 100%)",
      },
      colors: {
        "gradient-start": "#4D4434",
        "gradient-middle": "#FE8912",
        "gradient-end": "#4D4434",
      },
    },
  },
  plugins: [],
};
