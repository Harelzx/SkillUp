import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
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
import { colors, spacing, shadows } from '@/theme/tokens';

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

// State Machine for Banner
type BannerEvent = 
  | { type: 'AUTO_TICK' }
  | { type: 'SWIPE_RIGHT' }
  | { type: 'SWIPE_LEFT' };

interface BannerState {
  activeIndex: number;
  dotIndex: number;
  count: number;
}

function bannerReducer(state: BannerState, event: BannerEvent): BannerState {
  const { activeIndex, dotIndex, count } = state;
  
  switch (event.type) {
    case 'AUTO_TICK':
      // Auto-advance: activeIndex++, dotIndex-- (dots move LEFT)
      return {
        ...state,
        activeIndex: (activeIndex + 1) % count,
        dotIndex: (dotIndex - 1 + count) % count,
      };
    
    case 'SWIPE_RIGHT':
      // Swipe right: activeIndex++, dotIndex-- (dots move LEFT)
      return {
        ...state,
        activeIndex: (activeIndex + 1) % count,
        dotIndex: (dotIndex - 1 + count) % count,
      };
    
    case 'SWIPE_LEFT':
      // Swipe left: activeIndex--, dotIndex++ (dots move RIGHT)
      return {
        ...state,
        activeIndex: (activeIndex - 1 + count) % count,
        dotIndex: (dotIndex + 1) % count,
      };
    
    default:
      return state;
  }
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  messages,
  autoRotateInterval = 10000,
}) => {
  // Note: RTL context is available but not actively used in this component
  
  // State machine
  const [state, dispatch] = useReducer(bannerReducer, {
    activeIndex: 0,
    dotIndex: 0,
    count: messages.length,
  });
  
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

  // Sync ref
  useEffect(() => {
    activeIndexRef.current = state.activeIndex;
  }, [state.activeIndex]);

  // Update count when messages change
  useEffect(() => {
    if (state.count !== messages.length) {
      dispatch({ type: 'AUTO_TICK' }); // Reset to valid state
    }
  }, [messages.length, state.count]);

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

  // Animate slide transition
  const animateTransition = useCallback((direction: 'next' | 'prev') => {
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
    } else {
      const currentOutOffset = direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH;
      const nextInFromOffset = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

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
        translateX.setValue(nextInFromOffset);
        fadeAnim.setValue(0.3);
        
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

  const handleAutoTick = useCallback(() => {
    if (messages.length <= 1) return;
    dispatch({ type: 'AUTO_TICK' });
    animateTransition('next');
  }, [messages.length, animateTransition]);

  const handleSwipeRight = useCallback(() => {
    if (messages.length <= 1) return;
    dispatch({ type: 'SWIPE_RIGHT' });
    animateTransition('next');
  }, [messages.length, animateTransition]);

  const handleSwipeLeft = useCallback(() => {
    if (messages.length <= 1) return;
    dispatch({ type: 'SWIPE_LEFT' });
    animateTransition('prev');
  }, [messages.length, animateTransition]);

  const pauseAutoRotation = useCallback(() => {
    setIsPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, []);

  // Pan responder
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
          if (gestureState.dx > 0 || velocity > 0.5) {
            handleSwipeRight();
          } else if (gestureState.dx < 0 || velocity < -0.5) {
            handleSwipeLeft();
          }
        } else {
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

  // Auto-rotation timer
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
        handleAutoTick();
      }, autoRotateInterval);
    }

    return () => {
      if (autoRotateTimer.current) {
        clearTimeout(autoRotateTimer.current);
        autoRotateTimer.current = null;
      }
    };
  }, [state.activeIndex, isPaused, isTransitioning, messages.length, appState, autoRotateInterval, handleAutoTick]);

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

  const currentMessage = messages[state.activeIndex];
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
            <View style={{ 
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1],
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <Typography style={{ fontSize: 18, lineHeight: 24 }}>
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

      {/* Indicator Dots - controlled by dotIndex from state machine */}
      {messages.length > 1 && (
        <View
          style={{
            flexDirection: 'row', // Natural LTR: index 0=left, high=right
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: spacing[2] + 4,
            gap: spacing[2],
          }}
        >
          {messages.map((_, index) => (
            <View
              key={index}
              style={{
                width: index === state.dotIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === state.dotIndex ? colors.primary[600] : colors.gray[300],
                opacity: index === state.dotIndex ? 1 : 0.5,
              }}
              accessible={false}
            />
          ))}
        </View>
      )}
    </View>
  );
};
