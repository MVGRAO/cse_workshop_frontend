'use client';

import React from 'react';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  isLoading = false,
  className = '',
  type = 'button',
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      style={{
        opacity: disabled || isLoading ? 0.6 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      }}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  );
};

export default Button;

