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
  autoRotateInterval?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ANIMATION_DURATION = 320;
const FADE_DURATION = 140;

export const InfoBanner: React.FC<InfoBannerProps> = ({
  messages,
  autoRotateInterval = 10000,
}) => {
  const { isRTL } = useRTL();
  
  // Single source of truth for active index
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  
  const [isPaused, setIsPaused] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const autoRotateTimer = useRef<NodeJS.Timeout | null>(null);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);

  // Sync state with ref to avoid stale closures
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Check for reduce motion preference
  useEffect(() => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        setIsReduceMotionEnabled(enabled ?? false);
      });
    }
  }, []);

  // Monitor app state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  // Navigate to specific index with animation
  const navigateToIndex = useCallback((toIndex: number, direction: 'left' | 'right') => {
    if (messages.length <= 1 || isTransitioning || isDragging.current) return;

    setIsTransitioning(true);
    
    if (isReduceMotionEnabled) {
      // Quick fade for reduced motion
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
      setActiveIndex(toIndex);
    } else {
      // Smooth slide animation
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
        // Update index (single source of truth)
        setActiveIndex(toIndex);
        
        // Reset position for next animation
        translateX.setValue(-targetOffset);
        fadeAnim.setValue(0.3);
        
        // Animate in
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
  }, [messages.length, isTransitioning, isReduceMotionEnabled, translateX, fadeAnim]);

  // Navigate to next (leftward)
  const goToNext = useCallback(() => {
    if (messages.length <= 1) return;
    const nextIndex = (activeIndexRef.current + 1) % messages.length;
    navigateToIndex(nextIndex, 'left');
  }, [messages.length, navigateToIndex]);

  // Navigate to previous (rightward)
  const goToPrevious = useCallback(() => {
    if (messages.length <= 1) return;
    const prevIndex = (activeIndexRef.current - 1 + messages.length) % messages.length;
    navigateToIndex(prevIndex, 'right');
  }, [messages.length, navigateToIndex]);

  // Pause auto-rotation
  const pauseAutoRotation = useCallback(() => {
    setIsPaused(true);
    
    if (pauseTimer.current) {
      clearTimeout(pauseTimer.current);
    }
    
    pauseTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, []);

  // Pan responder for continuous swipe
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Lock to horizontal axis
        const isHorizontal = Math.abs(gestureState.dx) > 10 && 
                            Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
        return isHorizontal && !isTransitioning;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        pauseAutoRotation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isReduceMotionEnabled || isTransitioning) return;
        
        const dragDistance = gestureState.dx;
        
        // Rubber band at edges
        const resistance = Math.abs(dragDistance) > SCREEN_WIDTH * 0.5 ? 0.5 : 1;
        translateX.setValue(dragDistance * resistance);
        
        // Fade during drag
        const progress = Math.min(Math.abs(dragDistance) / SCREEN_WIDTH, 0.3);
        fadeAnim.setValue(1 - progress);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        
        const threshold = SWIPE_THRESHOLD;
        const velocity = gestureState.vx;
        const absDistance = Math.abs(gestureState.dx);
        const shouldAdvance = absDistance > threshold || Math.abs(velocity) > 0.5;

        if (shouldAdvance) {
          // Swipe left = next, swipe right = previous
          if (gestureState.dx < 0 || velocity < -0.5) {
            goToNext();
          } else if (gestureState.dx > 0 || velocity > 0.5) {
            goToPrevious();
          }
        } else {
          // Return to current position
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
        isDragging.current = false;
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

  // Auto-rotation timer - always advances leftward
  useEffect(() => {
    // Clear any existing timer
    if (autoRotateTimer.current) {
      clearTimeout(autoRotateTimer.current);
      autoRotateTimer.current = null;
    }

    // Only start timer if conditions are met
    if (
      messages.length > 1 &&
      !isPaused &&
      !isTransitioning &&
      !isDragging.current &&
      appState === 'active'
    ) {
      autoRotateTimer.current = setTimeout(() => {
        goToNext(); // Always advance leftward
      }, autoRotateInterval);
    }

    return () => {
      if (autoRotateTimer.current) {
        clearTimeout(autoRotateTimer.current);
        autoRotateTimer.current = null;
      }
    };
  }, [activeIndex, isPaused, isTransitioning, messages.length, appState, autoRotateInterval, goToNext]);

  // Cleanup timers on unmount
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

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
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

  const currentMessage = messages[activeIndex];

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

      {/* Indicator Dots - synced with activeIndex */}
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
                width: index === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === activeIndex ? colors.primary[600] : colors.gray[300],
              }}
              accessible={false}
            />
          ))}
        </View>
      )}
    </View>
  );
};
