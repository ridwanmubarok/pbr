import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface UseTypingAnimationReturn {
  dot1Animation: Animated.Value;
  dot2Animation: Animated.Value;
  dot3Animation: Animated.Value;
  attachmentMenuAnimation: Animated.Value;
}

export const useTypingAnimation = (
  isTyping: boolean,
  showAttachmentMenu: boolean,
): UseTypingAnimationReturn => {
  const dot1Animation = useRef(new Animated.Value(0)).current;
  const dot2Animation = useRef(new Animated.Value(0)).current;
  const dot3Animation = useRef(new Animated.Value(0)).current;
  const attachmentMenuAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      const animateDot = (dotAnim: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);
      };

      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            animateDot(dot1Animation, 0),
            animateDot(dot2Animation, 200),
            animateDot(dot3Animation, 400),
          ]),
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(dot1Animation, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Animation, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Animation, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    } else {
      dot1Animation.setValue(0);
      dot2Animation.setValue(0);
      dot3Animation.setValue(0);
    }
  }, [isTyping, dot1Animation, dot2Animation, dot3Animation]);

  useEffect(() => {
    if (showAttachmentMenu) {
      Animated.spring(attachmentMenuAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      Animated.timing(attachmentMenuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showAttachmentMenu, attachmentMenuAnimation]);

  return {
    dot1Animation,
    dot2Animation,
    dot3Animation,
    attachmentMenuAnimation,
  };
};
