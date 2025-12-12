import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseDropdownMenuReturn {
  isOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  menuAnimation: Animated.Value;
}

export const useDropdownMenu = (): UseDropdownMenuReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.spring(menuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, menuAnimation]);

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  return {
    isOpen,
    toggleMenu,
    closeMenu,
    menuAnimation,
  };
};
