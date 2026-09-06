"use client";

import { useEffect, useState } from "react";

// Reads the data-theme attribute the blocking script in layout.tsx already
// set before paint (avoiding a flash of the wrong theme), then keeps it in
// sync with a click and persists the choice.
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable — theme just won't persist across visits
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="theme-toggle"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
