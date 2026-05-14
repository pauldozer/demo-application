import React, { createContext, useContext, useState } from 'react';

const DirectionContext = createContext({ direction: 'ltr', toggleDirection: () => {} });

export function DirectionProvider({ children }) {
  const [direction, setDirection] = useState(
    () => localStorage.getItem('clinic_direction') || 'ltr'
  );

  const toggleDirection = () => {
    const next = direction === 'ltr' ? 'rtl' : 'ltr';
    localStorage.setItem('clinic_direction', next);
    setDirection(next);
  };

  return (
    <DirectionContext.Provider value={{ direction, toggleDirection }}>
      {children}
    </DirectionContext.Provider>
  );
}

export const useDirection = () => useContext(DirectionContext);
