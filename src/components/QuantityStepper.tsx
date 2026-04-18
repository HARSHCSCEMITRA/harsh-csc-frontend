import React from 'react';

interface QuantityStepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onDecrement,
  onIncrement,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const btnSize = size === 'sm' ? '24px' : '28px';
  const fontSize = size === 'sm' ? '12px' : '14px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        className="qty-btn"
        style={{ width: btnSize, height: btnSize, fontSize: '16px' }}
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span style={{
        minWidth: size === 'sm' ? '20px' : '28px',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize,
        color: 'var(--text-primary)',
      }}>
        {value}
      </span>
      <button
        className="qty-btn"
        style={{ width: btnSize, height: btnSize, fontSize: '16px' }}
        onClick={onIncrement}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};
