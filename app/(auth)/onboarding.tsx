import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, BookOpen, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = true; // Hebrew app defaults to RTL
  const [currentSlide, setCurrentSlide] = useState(2); // RTL: Start with last slide
  const scrollViewRef = useRef<ScrollView>(null);

  // RTL: Initialize scroll position to last slide on component mount
  useEffect(() => {
    if (scrollViewRef.current) {
      // Wait for layout then scroll to last slide
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: 2 * width, // Last slide position
          animated: false,
        });
      }, 100);
    }
  }, []);

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: User,
      title: 'מצא את המורה המושלם',
      description: 'חבר עם מורים מקצועיים ומנוסים בתחומים שונים. מצא את המורה שמתאים בדיוק לצרכים שלך.',
    },
    {
      id: '2',
      icon: BookOpen,
      title: 'למד בקלות ובנוחות',
      description: 'קיים שיעורים אונליין או פרונטליים בזמנים הנוחים לך. טכנולוגיה מתקדמת לחווית למידה מיטבית.',
    },
    {
      id: '3',
      icon: Star,
      title: 'השג תוצאות מעולות',
      description: 'עקוב אחר ההתקדמות שלך, קבל משוב אישי וצור קשר ארוך טווח עם המורים הטובים ביותר.',
    },
  ];

  const handleNext = () => {
    console.log('handleNext called, currentSlide:', currentSlide);
    if (currentSlide > 0) {
      // RTL: Move backward through slides (right to left)
      const nextSlide = currentSlide - 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
    } else {
      // Reached first slide (leftmost), navigate to login
      console.log('Navigating to login');
      router.push('/(auth)/login');
    }
  };

  // Removed handleScrollEnd since swipe gestures are disabled

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const handleBack = () => {
    if (currentSlide < slides.length - 1) {
      // RTL: Move forward through slides (left to right to go back)
      const prevSlide = currentSlide + 1;
      setCurrentSlide(prevSlide);
      scrollViewRef.current?.scrollTo({
        x: prevSlide * width,
        animated: true,
      });
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    const IconComponent = slide.icon;

    return (
      <View key={slide.id} style={[styles.slideContainer, { width }]}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <IconComponent size={60} color="#4F46E5" />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View />
          {currentSlide < slides.length - 1 ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        {/* Slides Container */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.slidesContainer}
          contentContainerStyle={{ flexDirection: 'row-reverse' }}
        >
          {slides.map((slide, index) => renderSlide(slide, index))}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={[styles.bottomContainer, {
          paddingBottom: Math.max(32, insets.bottom + 40) // Increased clearance for better touch detection
        }]}>
          {/* Progress Indicators */}
          <View style={[styles.progressContainer, { flexDirection: 'row-reverse' }]}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    width: index === currentSlide ? 24 : 8,
                    backgroundColor: index === currentSlide ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  }
                ]}
              />
            )).reverse()}
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 10, left: 15, right: 15 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>
                {currentSlide === 0 ? 'בואו נתחיל' : 'המשך'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>דלג על ההקדמה</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  slidesContainer: {
    flex: 1,
    position: 'relative',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    // paddingBottom now handled dynamically with safe area insets
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionContainer: {
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 24,
    minWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});