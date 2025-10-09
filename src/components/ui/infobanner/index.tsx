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
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/ui/Typography';
import { colors, spacing, borderRadius, shadows } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';

export interface BannerMessage {
  id: string;
  type: 'SYSTEM' | 'PROMO' | 'LESSON_REMINDER';
  title: string;
  subtitle?: string;
  emoji?: string;
  imageUrl?: string; // For PROMO background image
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
        setActiveIndex(toIndex);
        translateX.setValue(-targetOffset);
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

  const goToNext = useCallback(() => {
    if (messages.length <= 1) return;
    const nextIndex = (activeIndexRef.current + 1) % messages.length;
    navigateToIndex(nextIndex, 'left');
  }, [messages.length, navigateToIndex]);

  const goToPrevious = useCallback(() => {
    if (messages.length <= 1) return;
    const prevIndex = (activeIndexRef.current - 1 + messages.length) % messages.length;
    navigateToIndex(prevIndex, 'right');
  }, [messages.length, navigateToIndex]);

  const pauseAutoRotation = useCallback(() => {
    setIsPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  }, []);

  // Pan responder for continuous swipe
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
          if (gestureState.dx < 0 || velocity < -0.5) {
            goToNext();
          } else if (gestureState.dx > 0 || velocity > 0.5) {
            goToPrevious();
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
        goToNext();
      }, autoRotateInterval);
    }

    return () => {
      if (autoRotateTimer.current) {
        clearTimeout(autoRotateTimer.current);
        autoRotateTimer.current = null;
      }
    };
  }, [activeIndex, isPaused, isTransitioning, messages.length, appState, autoRotateInterval, goToNext]);

  // Cleanup
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

  const getGradientColors = (type: BannerMessage['type']): string[] => {
    switch (type) {
      case 'SYSTEM':
        return ['rgba(59, 130, 246, 0.08)', 'rgba(37, 99, 235, 0.12)'];
      case 'PROMO':
        return ['rgba(168, 85, 247, 0.12)', 'rgba(147, 51, 234, 0.18)'];
      case 'LESSON_REMINDER':
        return ['rgba(34, 197, 94, 0.08)', 'rgba(22, 163, 74, 0.12)'];
      default:
        return ['rgba(107, 114, 128, 0.05)', 'rgba(75, 85, 99, 0.08)'];
    }
  };

  const getBorderColor = (type: BannerMessage['type']): string => {
    switch (type) {
      case 'SYSTEM':
        return 'rgba(59, 130, 246, 0.15)';
      case 'PROMO':
        return 'rgba(168, 85, 247, 0.15)';
      case 'LESSON_REMINDER':
        return 'rgba(34, 197, 94, 0.15)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
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
  const hasImage = currentMessage.type === 'PROMO' && currentMessage.imageUrl;

  const CardContent = (
    <View
      style={{
        flex: 1,
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
              flex: 1,
              color: hasImage ? colors.white : colors.gray[900],
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
              color: hasImage ? 'rgba(255, 255, 255, 0.9)' : colors.gray[600],
            }}
          >
            {truncateText(currentMessage.subtitle, 80)}
          </Typography>
        )}
      </View>
    </View>
  );

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
            borderColor: getBorderColor(currentMessage.type),
            overflow: 'hidden',
            ...shadows.sm,
          }}
        >
          {hasImage && currentMessage.imageUrl ? (
            // PROMO with background image + gradient overlay
            <ImageBackground
              source={{ uri: currentMessage.imageUrl }}
              style={{ width: '100%' }}
              imageStyle={{ borderRadius: 14 }}
            >
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.4)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              >
                {CardContent}
              </LinearGradient>
            </ImageBackground>
          ) : (
            // SYSTEM / LESSON_REMINDER with subtle gradient
            <LinearGradient
              colors={getGradientColors(currentMessage.type)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            >
              {CardContent}
            </LinearGradient>
          )}
        </View>
      </Animated.View>

      {/* Indicator Dots */}
      {messages.length > 1 && (
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
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
                width: index === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === activeIndex ? colors.primary[600] : colors.gray[300],
                opacity: index === activeIndex ? 1 : 0.5,
              }}
              accessible={false}
            />
          ))}
        </View>
      )}
    </View>
  );
};
