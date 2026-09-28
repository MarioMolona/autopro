import { createContext, useContext, useState } from 'react';

const ViewContext = createContext(null);

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}

export function ViewProvider({ children }) {
  const [activeView, setActiveView] = useState('projects'); // 'dashboard' or 'projects'

  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ViewContext.Provider>
  );
}
