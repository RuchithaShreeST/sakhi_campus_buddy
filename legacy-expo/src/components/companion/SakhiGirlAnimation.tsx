import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { CompanionState } from '@/types/wellness';

export function SakhiGirlAnimation({ state, children }: PropsWithChildren<{ state: CompanionState }>) {
  const [motion] = useState(() => new Animated.Value(0));
  const [breath] = useState(() => new Animated.Value(1));
  const [celebrate] = useState(() => new Animated.Value(0));

  useEffect(() => {
    motion.stopAnimation();
    breath.stopAnimation();
    celebrate.stopAnimation();
    const slow = ['sleeping', 'sleepy', 'tired', 'calm', 'reading', 'watchingMovie'].includes(state);
    const fast = ['running', 'dancing', 'celebrating', 'energetic'].includes(state);
    const duration = fast ? 360 : slow ? 1900 : 850;
    const movement = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1.035, duration: slow ? 1500 : 850, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1, duration: slow ? 1500 : 850, useNativeDriver: true }),
      ])
    );
    movement.start();
    breathing.start();
    if (state === 'celebrating')
      Animated.loop(
        Animated.sequence([
          Animated.timing(celebrate, { toValue: 1, duration: 360, useNativeDriver: true }),
          Animated.timing(celebrate, { toValue: 0, duration: 360, useNativeDriver: true }),
        ])
      ).start();
    return () => {
      movement.stop();
      breathing.stop();
      celebrate.stopAnimation();
    };
  }, [breath, celebrate, motion, state]);

  const translateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, state === 'celebrating' ? -14 : state === 'running' ? -8 : -5],
  });
  const translateX = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: state === 'dancing' ? [-5, 6, -5] : state === 'walking' || state === 'running' ? [0, 5, 0] : [0, 0, 0],
  });
  const rotate = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: state === 'dancing' ? ['-5deg', '5deg', '-5deg'] : ['0deg', '1deg', '0deg'],
  });
  const celebrateScale = celebrate.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX }, { translateY }, { rotate }, { scale: breath }, { scale: celebrateScale }] }]}>
      {children}
    </Animated.View>
  );
}

/** @deprecated Legacy alias */
export const MiraGirlAnimation = SakhiGirlAnimation;

const styles = StyleSheet.create({ container: { alignItems: 'center', justifyContent: 'flex-end' } });

