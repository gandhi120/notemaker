import React, { createContext, useContext, ReactNode } from 'react';
import { RootStore, getRootStore } from './RootStore';

const StoreContext = createContext<RootStore | null>(null);

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const rootStore = getRootStore();

  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook to use stores
export const useStores = (): RootStore => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return context;
};

// Individual store hooks for convenience
export const useNotesStore = () => {
  const { notesStore } = useStores();
  return notesStore;
};
