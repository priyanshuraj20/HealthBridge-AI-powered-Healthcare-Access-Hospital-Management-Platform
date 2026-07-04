import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";
import Layout from "./layout/Layout";
import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";

function App() {
  const location = useLocation();

  useEffect(() => {
    const activeTheme = localStorage.getItem("theme") || "light";
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    try {
      const scrollContainer = document.querySelector("[data-scroll-container]");
      if (!scrollContainer) return;

      const scroll = new LocomotiveScroll({
        el: scrollContainer,
        smooth: true,
        multiplier: 1.0,
        class: "is-revealed"
      });

      // Force Locomotive Scroll to recalculate dimensions on route load
      scroll.update();
      
      const timer = setTimeout(() => {
        scroll.update();
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scroll && typeof scroll.destroy === "function") {
          scroll.destroy();
        }
      };
    } catch (err) {
      console.warn("Locomotive Scroll failed to initialize:", err.message);
    }
  }, [location.pathname]);

  return (
    <div data-scroll-container>
      <Layout/>
    </div>
  );
}

export default App;
