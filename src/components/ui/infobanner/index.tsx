import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Animated,
  PanResponder,
  AccessibilityInfo,
  Dimensions,
  Platform,
  AppState,
  AppStateStatus,
  Easing,
} from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing, borderRadius, shadows } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';

export interface BannerMessage {
  id: string;
  type: 'SYSTEM' | 'PROMO' | 'LESSON_REMINDER';
  title: string;
  subtitle?: string;
  icon?: string;
}

interface InfoBannerProps {
  messages: BannerMessage[];
  autoRotateInterval?: number; // in milliseconds, default 10000
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width
const ANIMATION_DURATION = 320; // milliseconds for smooth slide transition
const FADE_DURATION = 140; // milliseconds for reduce motion fade

export const InfoBanner: React.FC<InfoBannerProps> = ({
  messages,
  autoRotateInterval = 10000,
}) => {
  const { isRTL } = useRTL();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSwipeTime = useRef<number>(0);
  const gestureInProgress = useRef(false);

  // Check for reduce motion preference
  useEffect(() => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        setIsReduceMotionEnabled(enabled ?? false);
      });
    }
  }, []);

  // Monitor app state to pause rotation when app is in background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const goToNext = useCallback(() => {
    if (messages.length <= 1 || isTransitioning || gestureInProgress.current) return;
    
    const now = Date.now();
    if (now - lastSwipeTime.current < 400) return; // Debounce
    lastSwipeTime.current = now;

    const nextIndex = (currentIndex + 1) % messages.length;
    animateToIndex(nextIndex, 'left'); // Advance leftward
  }, [currentIndex, messages.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (messages.length <= 1 || isTransitioning || gestureInProgress.current) return;

    const now = Date.now();
    if (now - lastSwipeTime.current < 400) return; // Debounce
    lastSwipeTime.current = now;

    const prevIndex = (currentIndex - 1 + messages.length) % messages.length;
    animateToIndex(prevIndex, 'right'); // Go back rightward
  }, [currentIndex, messages.length, isTransitioning]);

  const animateToIndex = (toIndex: number, direction: 'left' | 'right') => {
    if (isReduceMotionEnabled) {
      // Quick fade for reduced motion
      setIsTransitioning(true);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTransitioning(false);
      });
      setCurrentIndex(toIndex);
    } else {
      // Smooth slide animation
      setIsTransitioning(true);
      const targetOffset = direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH;

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: targetOffset,
          duration: ANIMATION_DURATION,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update index and reset position
        setCurrentIndex(toIndex);
        translateX.setValue(-targetOffset);
        fadeAnim.setValue(0.3);
        
        // Animate back to center
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    }
  };

  const pauseAutoRotation = useCallback(() => {
    setIsPaused(true);
    if (pauseTimer.current) {
      clearTimeout(pauseTimer.current);
    }
    // Resume after 1.5 seconds
    pauseTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, []);

  // Pan responder for continuous swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const horizontalSwipe = Math.abs(gestureState.dx) > 10 && 
                                Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
        return horizontalSwipe && !isTransitioning;
      },
      onPanResponderGrant: () => {
        gestureInProgress.current = true;
        pauseAutoRotation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isReduceMotionEnabled || isTransitioning) return;
        
        const dragDistance = gestureState.dx;
        
        // Apply rubber band effect at edges
        const resistance = Math.abs(dragDistance) > SCREEN_WIDTH * 0.5 ? 0.5 : 1;
        translateX.setValue(dragDistance * resistance);
        
        // Fade slightly during drag
        const progress = Math.min(Math.abs(dragDistance) / SCREEN_WIDTH, 0.3);
        fadeAnim.setValue(1 - progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        gestureInProgress.current = false;
        const threshold = SWIPE_THRESHOLD;
        const velocity = Math.abs(gestureState.vx);
        const absDistance = Math.abs(gestureState.dx);

        if (absDistance > threshold || velocity > 0.5) {
          // Swipe left = next, swipe right = previous
          if (gestureState.dx < 0) {
            goToNext();
          } else {
            goToPrevious();
          }
        } else {
          // Return to current position with smooth spring
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              tension: 50,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.spring(fadeAnim, {
              toValue: 1,
              tension: 50,
              friction: 10,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        gestureInProgress.current = false;
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  // Auto-rotation logic - advance leftward every 10s
  useEffect(() => {
    // Only rotate when app is active, not paused, and has multiple messages
    if (messages.length <= 1 || isPaused || appState !== 'active' || isTransitioning) {
      return;
    }

    autoRotateTimer.current = setTimeout(() => {
      goToNext(); // Auto-advance leftward
    }, autoRotateInterval);

    return () => {
      if (autoRotateTimer.current) {
        clearTimeout(autoRotateTimer.current);
      }
    };
  }, [currentIndex, isPaused, messages.length, appState, isTransitioning, goToNext, autoRotateInterval]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  const getIconForType = (type: BannerMessage['type']): string => {
    switch (type) {
      case 'SYSTEM':
        return 'ℹ️';
      case 'PROMO':
        return '⭐';
      case 'LESSON_REMINDER':
        return '⏰';
      default:
        return 'ℹ️';
    }
  };

  const getBackgroundColorForType = (type: BannerMessage['type']): string => {
    switch (type) {
      case 'SYSTEM':
        return colors.blue[50];
      case 'PROMO':
        return colors.purple[50];
      case 'LESSON_REMINDER':
        return colors.green[50];
      default:
        return colors.gray[50];
    }
  };

  const getBorderColorForType = (type: BannerMessage['type']): string => {
    switch (type) {
      case 'SYSTEM':
        return colors.blue[100];
      case 'PROMO':
        return colors.purple[100];
      case 'LESSON_REMINDER':
        return colors.green[100];
      default:
        return colors.gray[100];
    }
  };

  // Smart text truncation
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    
    // Find last space before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '…';
    }
    return truncated + '…';
  };

  if (messages.length === 0) {
    return null;
  }

  const currentMessage = messages[currentIndex];

  return (
    <View
      style={{
        backgroundColor: colors.white,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
      }}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          opacity: fadeAnim,
          transform: [{ translateX }],
        }}
      >
        <View
          style={{
            backgroundColor: getBackgroundColorForType(currentMessage.type),
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: getBorderColorForType(currentMessage.type),
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[4],
            minHeight: 80,
            ...shadows.sm,
            // Center content horizontally and vertically
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          {/* Icon - centered */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.white,
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Typography variant="body1">
              {currentMessage.icon || getIconForType(currentMessage.type)}
            </Typography>
          </View>

          {/* Content - centered */}
          <View style={{ 
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
          }}>
            <Typography
              variant="body1"
              weight="semibold"
              align="center"
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{ 
                fontSize: 16,
                lineHeight: 22,
                textAlign: 'center',
                width: '100%',
              }}
            >
              {truncateText(currentMessage.title, 65)}
            </Typography>
            {currentMessage.subtitle && (
              <Typography
                variant="caption"
                color="textSecondary"
                align="center"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                {truncateText(currentMessage.subtitle, 80)}
              </Typography>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Indicator Dots - synced with leftward advance */}
      {messages.length > 1 && (
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: spacing[2] + 2,
            gap: spacing[2],
          }}
        >
          {messages.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === currentIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === currentIndex ? colors.primary[600] : colors.gray[300],
              }}
              accessible={false}
            />
          ))}
        </View>
      )}
    </View>
  );
};
