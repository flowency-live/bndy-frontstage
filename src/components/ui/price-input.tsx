import React, { useState, useEffect } from 'react';
import { Input } from "./Input";

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PriceInput({ value, onChange, className }: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(value ? `£${value}` : 'Free');

  useEffect(() => {
    setDisplayValue(value ? `£${value}` : 'Free');
  }, [value]);

  const handleChange = (input: string) => {
    if (input === '' || input === 'Free') {
      setDisplayValue('Free');
      onChange('');
      return;
    }

    // Remove currency symbol and any non-numeric characters except decimal point
    const numericValue = input.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    const cleanValue = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');

    if (cleanValue) {
      setDisplayValue(`£${cleanValue}`);
      onChange(cleanValue);
    }
  };

  const handleFocus = () => {
    if (displayValue === 'Free') {
      setDisplayValue('£');
    }
  };

  const handleBlur = () => {
    if (displayValue === '£' || !displayValue) {
      setDisplayValue('Free');
      onChange('');
    }
  };

  return (
    <Input
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder="Free"
    />
  );
}