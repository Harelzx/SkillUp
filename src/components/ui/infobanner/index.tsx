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
  emoji?: string;
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

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        setIsReduceMotionEnabled(enabled ?? false);
      });
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  // Navigate to specific index with REVERSED animation direction
  const navigateToIndex = useCallback((toIndex: number, direction: 'next' | 'prev') => {
    if (messages.length <= 1 || isTransitioning || isDragging.current) return;

    setIsTransitioning(true);
    
    if (isReduceMotionEnabled) {
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
      // REVERSED ANIMATION:
      // For NEXT: current → RIGHT (+100%), next ← LEFT (-100% → 0)
      // For PREV: current → LEFT (-100%), prev ← RIGHT (+100% → 0)
      const currentOutOffset = direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH;
      const nextInFromOffset = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

      // Phase 1: Slide current out
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: currentOutOffset,
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
        // Update index
        setActiveIndex(toIndex);
        
        // Position next slide off-screen
        translateX.setValue(nextInFromOffset);
        fadeAnim.setValue(0.3);
        
        // Phase 2: Slide next in
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

  const goToNext = useCallback(() => {
    if (messages.length <= 1) return;
    const nextIndex = (activeIndexRef.current + 1) % messages.length;
    navigateToIndex(nextIndex, 'next');
  }, [messages.length, navigateToIndex]);

  const goToPrevious = useCallback(() => {
    if (messages.length <= 1) return;
    const prevIndex = (activeIndexRef.current - 1 + messages.length) % messages.length;
    navigateToIndex(prevIndex, 'prev');
  }, [messages.length, navigateToIndex]);

  const pauseAutoRotation = useCallback(() => {
    setIsPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, []);

  // Pan responder with REVERSED swipe mapping
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
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
        const resistance = Math.abs(dragDistance) > SCREEN_WIDTH * 0.5 ? 0.5 : 1;
        translateX.setValue(dragDistance * resistance);
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
          // REVERSED MAPPING:
          // Swipe RIGHT (dx > 0) → go to NEXT (current slides right out, next comes from left)
          // Swipe LEFT (dx < 0) → go to PREVIOUS (current slides left out, prev comes from right)
          if (gestureState.dx > 0 || velocity > 0.5) {
            goToNext(); // Swipe right → next
          } else if (gestureState.dx < 0 || velocity < -0.5) {
            goToPrevious(); // Swipe left → previous
          }
        } else {
          // Snap back to current
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
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  // Auto-rotation timer (unchanged - still advances to next every 10s)
  useEffect(() => {
    if (autoRotateTimer.current) {
      clearTimeout(autoRotateTimer.current);
      autoRotateTimer.current = null;
    }

    if (
      messages.length > 1 &&
      !isPaused &&
      !isTransitioning &&
      !isDragging.current &&
      appState === 'active'
    ) {
      autoRotateTimer.current = setTimeout(() => {
        goToNext(); // Auto-advance to next
      }, autoRotateInterval);
    }

    return () => {
      if (autoRotateTimer.current) {
        clearTimeout(autoRotateTimer.current);
        autoRotateTimer.current = null;
      }
    };
  }, [activeIndex, isPaused, isTransitioning, messages.length, appState, autoRotateInterval, goToNext]);

  useEffect(() => {
    return () => {
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  const getDefaultEmoji = (type: BannerMessage['type']): string => {
    switch (type) {
      case 'SYSTEM':
        return '🔔';
      case 'PROMO':
        return '🎉';
      case 'LESSON_REMINDER':
        return '📚';
      default:
        return '💡';
    }
  };

  const getBackgroundColors = (type: BannerMessage['type']): { start: string; end: string } => {
    switch (type) {
      case 'SYSTEM':
        return { start: '#EFF6FF', end: '#DBEAFE' };
      case 'PROMO':
        return { start: '#FAF5FF', end: '#F3E8FF' };
      case 'LESSON_REMINDER':
        return { start: '#F0FDF4', end: '#DCFCE7' };
      default:
        return { start: '#F9FAFB', end: '#F3F4F6' };
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
  const emoji = currentMessage.emoji || getDefaultEmoji(currentMessage.type);
  const bgColors = getBackgroundColors(currentMessage.type);

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
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.gray[200],
            overflow: 'hidden',
            ...shadows.sm,
            backgroundColor: bgColors.start,
          }}
        >
          {/* Gradient overlay simulation */}
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: bgColors.end,
            opacity: 0.3,
          }} />

          <View
            style={{
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[4],
              minHeight: 84,
            }}
          >
            {/* Text with inline emoji */}
            <View style={{ 
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1],
            }}>
              {/* Title with emoji */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <Typography
                  style={{
                    fontSize: 18,
                    lineHeight: 24,
                  }}
                >
                  {emoji}
                </Typography>
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
                    color: colors.gray[900],
                  }}
                >
                  {truncateText(currentMessage.title, 65)}
                </Typography>
              </View>

              {/* Subtitle */}
              {currentMessage.subtitle && (
                <Typography
                  variant="caption"
                  align="center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    textAlign: 'center',
                    width: '100%',
                    color: colors.gray[600],
                  }}
                >
                  {truncateText(currentMessage.subtitle, 80)}
                </Typography>
              )}
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Indicator Dots - inverted mapping for leftward visual progression */}
      {messages.length > 1 && (
        <View
          style={{
            flexDirection: 'row', // Regular row: index 0 on left, high on right
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: spacing[2] + 4,
            gap: spacing[2],
          }}
        >
          {messages.map((_, index) => {
            // Inverted mapping: when activeIndex increases, highlighted dot moves LEFT
            const dotIndex = messages.length - 1 - activeIndex;
            return (
              <View
                key={index}
                style={{
                  width: index === dotIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    index === dotIndex ? colors.primary[600] : colors.gray[300],
                  opacity: index === dotIndex ? 1 : 0.5,
                }}
                accessible={false}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};
