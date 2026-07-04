/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  
  ],
  theme: {
    extend: {
      colors: {
        primaryColor: "#0d9488",      // Teal 600
        buttonBgColor: "#0d9488",
        yellowColor: "#f59e0b",       // Amber 500
        purpleColor: "#6366f1",       // Indigo 500
        irisBlueColor: "#06b6d4",     // Cyan 500
        headingColor: "#0f172a",      // Slate 900
        textColor: "#475569",         // Slate 600
      },
      boxShadow : {
        panelShadow: "rgba(15, 23, 42, 0.05) 0px 10px 30px 0px;",
      }
    },
  },
  plugins: [],
}
