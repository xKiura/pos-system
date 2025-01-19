import React from 'react';
import './NumPad.css';

const NumPad = ({ onNumberClick, onDelete, onClear, pin, confirmPin }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'];

  const handleClick = (value) => {
    if (value === '⌫') onDelete();
    else if (value === 'C') onClear();
    else onNumberClick(value);
  };

  return (
    <div className="numpad-section">
      <div className="numpad-container">
        {numbers.map((num, index) => (
          <button
            type="button"
            key={index}
            className={`numpad-button ${typeof num !== 'number' ? 'function-btn' : ''}`}
            onClick={() => handleClick(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NumPad;
