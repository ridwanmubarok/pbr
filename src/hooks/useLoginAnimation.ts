import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface UseLoginAnimationReturn {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const useLoginAnimation = (): UseLoginAnimationReturn => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return {
    fadeAnim,
    slideAnim,
  };
};
