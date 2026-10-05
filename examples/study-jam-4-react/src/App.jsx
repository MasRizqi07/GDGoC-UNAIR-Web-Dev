import { useState, useEffect }
from "react";

import Header
from "./components/Header";

import ThemeToggle
from "./components/ThemeToggle";

import Counter
from "./components/Counter";

import "./App.css";

function App() {

  const [count, setCount]
    = useState(0);

  const [darkMode, setDarkMode]
    = useState(false);

  const [lastOpen, setLastOpen]
    = useState("");



  useEffect(() => {

    const savedTheme =
      localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
    }

  }, []);



  useEffect(() => {

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );

  }, [darkMode]);



  useEffect(() => {

    const now =
      new Date().toLocaleString(
        "id-ID"
      );

    setLastOpen(now);

  }, []);



  function toggleTheme() {
    setDarkMode(!darkMode);
  }



  function increaseCount() {
    setCount(count + 1);
  }



  return (

    <div
      className={
        darkMode
          ? "app dark"
          : "app light"
      }
    >

      <Header
        name="Rizqi"
      />

      <ThemeToggle
        darkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      <Counter
        count={count}
        increaseCount={
          increaseCount
        }
      />

      <h3>
        Last Open:
      </h3>

      <p>{lastOpen}</p>

    </div>

  );
}

export default App;