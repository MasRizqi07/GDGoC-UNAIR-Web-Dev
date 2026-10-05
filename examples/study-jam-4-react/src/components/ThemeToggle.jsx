function ThemeToggle({
    darkMode,
    toggleTheme,
  }) {
    return (
      <div>
  
        <h3>
          Current Theme:
        </h3>
  
        <p>
          {darkMode
            ? "🌙 Dark Mode"
            : "🌞 Light Mode"}
        </p>
  
        <button onClick={toggleTheme}>
          Toggle Theme
        </button>
  
      </div>
    );
  }
  
  export default ThemeToggle;