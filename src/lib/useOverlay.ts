import { createContext, useContext } from 'react';

// ✅ Contexte pour gérer les overlays/navigation
export const OverlayContext = createContext<{
  openOverlay: (screenName: string) => void;
  closeOverlay: () => void;
}>({
  openOverlay: () => {},
  closeOverlay: () => {},
});

// ✅ Hook pour utiliser le contexte
export const useOverlay = () => {
  const context = useContext(OverlayContext);
  
  if (!context) {
    console.warn('⚠️ useOverlay doit être utilisé à l\'intérieur de OverlayContext.Provider');
    return {
      openOverlay: () => {},
      closeOverlay: () => {},
    };
  }
  
  return context;
};
