function Counter({
    count,
    increaseCount,
  }) {
    return (
      <div>
  
        <h3>
          Total Click:
        </h3>
  
        <h2>{count}</h2>
  
        <button onClick={increaseCount}>
          Increase
        </button>
  
      </div>
    );
  }
  
  export default Counter;