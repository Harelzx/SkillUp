import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSubjects } from '@/services/api';
import { useSearchTeachers } from '@/hooks/useTeachers';
import { getRegions } from '@/services/api/regionsAPI';
import type { Region } from '@/types/database';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Search as SearchIcon,
  X,
  Filter,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  ChevronDown,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

// Import Teacher interface
interface Teacher {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  hourlyRate: number;
  subjects: string[];
  rating?: number;
  totalReviews?: number;
  nextAvailable?: string;
  location?: string;
  experienceYears?: number;
  totalStudents?: number;
}


// Category to subjects mapping (Hebrew names from database)
const categorySubjectsMap: Record<string, string[]> = {
  'mathematics_sciences': ['מתמטיקה', 'פיזיקה', 'כימיה', 'ביולוגיה'],
  'languages': ['אנגלית', 'עברית', 'ספרות'],
  'music_arts': ['מוזיקה', 'אמנות'],
  'technology': ['מדעי המחשב'],
  'sports_fitness': ['אימון אישי', 'כושר', 'יוגה', 'פילאטיס', 'כדורגל', 'כדורסל', 'טניס'],
  'academic_courses': ['מתמטיקה', 'פיזיקה', 'כימיה', 'מדעי המחשב'],
};

// Category display names
const categoryNames: Record<string, string> = {
  'mathematics_sciences': 'מתמטיקה ומדעים',
  'languages': 'שפות זרות',
  'music_arts': 'מוזיקה ואמנות',
  'technology': 'טכנולוגיה ותכנות',
  'sports_fitness': 'ספורט ואימונים',
  'academic_courses': 'קורסי אקדמיה',
};

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isRTL, getFlexDirection } = useRTL();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([50, 300]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'reviews'>('rating');
  const [isSearching, setIsSearching] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Get category from URL params
  const incomingCategory = params.category as string | undefined;

  // Handle incoming category from navigation
  useEffect(() => {
    if (incomingCategory && categorySubjectsMap[incomingCategory]) {
      // Don't set selectedCategory directly - we'll handle it in filtering
    }
  }, [incomingCategory]);

  // Fetch subjects from API
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });

  // Fetch regions from API
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await getRegions();
      return response.success ? response.regions : [];
    },
  });

  const regions: Region[] = regionsData || [];

  // Fetch teachers from unified `teachers`
  const { data: teachersData = [], isLoading: loadingTeachers } = useSearchTeachers({
    query: searchQuery,
    subjects: selectedCategory && selectedCategory !== 'all'
      ? subjects.filter(s => s.name_he === selectedCategory).map(s => s.id)
      : undefined,
    regionId: selectedRegion || undefined,
    minRate: priceRange[0],
    maxRate: priceRange[1],
    sortBy: sortBy,
    limit: 100,
  });

  const mockTeachers: Teacher[] = teachersData || [];

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'מתמטיקה לבגרות',
    'אנגלית מדוברת',
    'פסנתר למתחילים',
  ]);

  const ratings = [4.5, 4.0, 3.5, 3.0];

  // Popular subjects - using Hebrew names from database
  const popularSubjects = [
    { id: 'all', name: 'הכל', icon: '🌟' },
    // Subjects from database
    { id: 'אנגלית', name: 'אנגלית', icon: '🇬🇧' },
    { id: 'מתמטיקה', name: 'מתמטיקה', icon: '📐' },
    { id: 'פיזיקה', name: 'פיזיקה', icon: '⚗️' },
    { id: 'כימיה', name: 'כימיה', icon: '⚗️' },
    { id: 'מוזיקה', name: 'מוזיקה', icon: '🎹' },
    { id: 'אמנות', name: 'אמנות', icon: '🎨' },
    { id: 'מדעי המחשב', name: 'מדעי המחשב', icon: '💻' },
    { id: 'ביולוגיה', name: 'ביולוגיה', icon: '🧬' },
    { id: 'היסטוריה', name: 'היסטוריה', icon: '📚' },
    { id: 'עברית', name: 'עברית', icon: '📖' },
    { id: 'גיאוגרפיה', name: 'גיאוגרפיה', icon: '🌍' },
    { id: 'ספרות', name: 'ספרות', icon: '📚' },
  ];

  // Advanced filtering logic - removed duplicate searchQuery and city filters (already done in server)
  const filteredTeachers = useMemo(() => {
    let results = mockTeachers;

    // Filter by incoming category (from navigation)
    if (incomingCategory && categorySubjectsMap[incomingCategory]) {
      const allowedSubjects = categorySubjectsMap[incomingCategory];
      results = results.filter(teacher =>
        Array.isArray(teacher.subjects) && teacher.subjects.some(subject => allowedSubjects.includes(String(subject)))
      );
    }

    // Filter by selected category (local)
    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(teacher =>
        Array.isArray(teacher.subjects) && teacher.subjects.some(s => String(s) === String(selectedCategory))
      );
    }

    // Note: Region filtering is now handled server-side via regionId param
    // No need for client-side city filtering anymore

    // Filter by price range (already in server, but keep as safety)
    results = results.filter(teacher =>
      teacher.hourlyRate >= priceRange[0] && teacher.hourlyRate <= priceRange[1]
    );

    // Filter by rating
    if (selectedRating) {
      results = results.filter(teacher =>
        (teacher.rating || 0) >= selectedRating
      );
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.hourlyRate - b.hourlyRate;
        case 'price_high':
          return b.hourlyRate - a.hourlyRate;
        case 'reviews':
          return (b.totalReviews || 0) - (a.totalReviews || 0);
        case 'rating':
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    return results;
  }, [mockTeachers, incomingCategory, selectedCategory, selectedRegion, priceRange, selectedRating, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = incomingCategory || searchQuery || (selectedCategory && selectedCategory !== 'all') ||
                          selectedRegion ||
                          priceRange[0] > 50 || priceRange[1] < 300 || selectedRating;

  // Update isSearching based on API loading state
  useEffect(() => {
    setIsSearching(loadingTeachers);
  }, [loadingTeachers]);


  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleRecentSearch = (search: string) => {
    setSearchQuery(search);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedRegion(null);
    setPriceRange([50, 300]);
    setSelectedRating(null);
    setSortBy('rating');
    // Clear the incoming category by navigating back
    if (incomingCategory) {
      router.replace('/(tabs)/search');
    }
  };


  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const renderTeacherCard = ({ item }: { item: Teacher }) => {
    // Safety check
    if (!item || !item.id) {
      return null;
    }

    // Ensure all fields are strings
    const safeName = String(item.displayName || 'לא ידוע');
    const safeBio = String(item.bio || '').trim();
    const safeRate = Number(item.hourlyRate) || 0;
    const safeRating = Number(item.rating) || 0;
    const safeReviews = Number(item.totalReviews) || 0;
    const safeLocation = String(item.location || '').trim();

    // Ensure subjects is always an array - convert all to strings and filter empty
    const safeSubjects = Array.isArray(item.subjects)
      ? item.subjects.map((s: any) => String(s || '')).filter((s: string) => s.trim() !== '')
      : [];

    return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/teacher/${String(item.id)}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.teacherCard}>
        <CardContent>
          {/* Row 1: Avatar + Name (right) | Rating (left) */}
          <View style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[2],
          }}>
            {/* Right side: Avatar + Name */}
            <View style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              flex: 1,
            }}>
              {/* Avatar */}
              <View style={styles.teacherAvatar}>
                {item.avatarUrl ? (
                  <Image
                    source={{ uri: item.avatarUrl }}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Typography variant="h5" color="white" weight="bold">
                    {safeName.charAt(0) || '?'}
                  </Typography>
                )}
              </View>

              {/* Name - right aligned */}
              <Typography
                variant="body1"
                weight="semibold"
                numberOfLines={1}
                style={{ flex: 1, fontSize: 16, textAlign: 'right', marginRight: spacing[2] }}
              >
                {safeName}
              </Typography>
            </View>

            {/* Left side: Rating */}
            <View style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
            }}>
              <Star size={13} color={colors.warning[500]} fill={colors.warning[500]} />
              {safeRating > 0 ? (
                <>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ fontSize: 13, marginHorizontal: 4 }}
                  >
                    {safeRating.toFixed(1)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{ fontSize: 12, opacity: 0.7 }}
                  >
                    {`(${safeReviews})`}
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ fontSize: 12, marginLeft: 4 }}
                >
                  חדש
                </Typography>
              )}
            </View>
          </View>

          {/* Row 2: Bio - right aligned */}
          {safeBio && (
            <View style={{ marginBottom: spacing[2] }}>
              <Typography
                variant="body2"
                color="textSecondary"
                numberOfLines={2}
                style={{ fontSize: 13, textAlign: 'right' }}
              >
                {safeBio}
              </Typography>
            </View>
          )}

          {/* Row 3: Subjects chips - left aligned */}
          {safeSubjects.length > 0 && (
            <View style={{
              flexDirection: 'row-reverse',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              marginBottom: spacing[2],
            }}>
              {safeSubjects.slice(0, 3).map((subject, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.gray[100],
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.gray[200],
                    marginHorizontal: 3,
                    marginVertical: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{
                      fontSize: 12,
                      color: colors.gray[700],
                      textAlign: 'center',
                    }}
                  >
                    {String(subject || '')}
                  </Typography>
                </View>
              ))}
              {safeSubjects.length > 3 && (
                <View style={{
                  paddingHorizontal: spacing[2],
                  paddingVertical: 6,
                }}>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{ fontSize: 11, textAlign: 'center' }}
                  >
                    {`+${safeSubjects.length - 3} עוד`}
                  </Typography>
                </View>
              )}
            </View>
          )}

          {/* Row 4: Price (right) | Location (left) */}
          <View style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Left side: Location */}
            {safeLocation ? (
              <View style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
              }}>
                <Typography
                  variant="caption"
                  style={{ fontSize: 14, fontWeight: 'light', textAlign: 'right', marginRight: 4 }}
                >
                  {safeLocation}
                </Typography>
                <MapPin size={12} color={colors.green[600]} />
              </View>
            ) : (
              <View />
            )}

            {/* Right side: Price */}
            <Typography
              variant="body2"
              weight="bold"
              style={{ fontSize: 14, color: colors.blue[500] }}
            >
              {`₪${safeRate}/שעה`}
            </Typography>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
    );
  };

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    greeting: {
      marginBottom: spacing[3],
    },
    searchContainer: {
      backgroundColor: colors.gray[100],
      borderRadius: 12,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      alignItems: 'center',
      marginBottom: spacing[3],
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.gray[900],
      textAlign: isRTL ? 'right' : 'left',
      marginHorizontal: spacing[2],
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    clearButton: {
      padding: spacing[1],
    },
    categoriesContainer: {
      marginBottom: spacing[1],
    },
    categoryPill: {
      backgroundColor: colors.white,
      borderRadius: 8,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      borderWidth: 1,
      borderColor: colors.gray[200],
      alignItems: 'center',
    },
    categoryPillActive: {
      backgroundColor: colors.primary[50],
      borderColor: colors.primary[500],
    },
    categoryContent: {
      alignItems: 'center',
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    recentSearches: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: colors.white,
    },
    recentSearchChip: {
      backgroundColor: colors.gray[100],
      borderRadius: 6,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      marginBottom: spacing[2],
      borderWidth: 1,
      borderColor: colors.gray[200],
    },
    searchResults: {
      flex: 1,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
    },
    resultHeader: {
      marginBottom: spacing[3],
    },
    teacherCard: {
      marginBottom: spacing[3],
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    teacherRow: {
      alignItems: 'center',
    },
    teacherAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
    },
    teacherInfo: {
      flex: 1,
      marginHorizontal: spacing[3],
    },
    subjectsRow: {
      marginTop: spacing[1],
    },
    subjectBadge: {
      backgroundColor: colors.gray[100],
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.gray[200],
      marginHorizontal: 3,
      marginVertical: 2,
    },
    teacherMeta: {
      alignItems: 'flex-end',
    },
    ratingRow: {
      alignItems: 'center',
      marginBottom: spacing[1],
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing[8],
    },
    trendingSection: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    filterButton: {
      padding: spacing[2],
      marginLeft: spacing[2],
    },
    filterRow: {
      marginBottom: spacing[4],
    },
    filterChip: {
      backgroundColor: colors.gray[100],
      borderRadius: 20,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      marginBottom: spacing[2],
    },
    filterChipActive: {
      backgroundColor: colors.primary[600],
    },
    ratingChip: {
      backgroundColor: colors.gray[100],
      borderRadius: 8,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.gray[200],
    },
    priceRangeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    priceButton: {
      backgroundColor: colors.gray[100],
      borderRadius: 8,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      flex: 1,
      marginHorizontal: spacing[1],
      alignItems: 'center',
    },
    priceButtonActive: {
      backgroundColor: colors.primary[600],
    },
    clearFiltersButton: {
      backgroundColor: colors.gray[200],
      borderRadius: 20,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: spacing[3],
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'flex-end',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Greeting or Category Title */}
        <View style={styles.greeting}>
          {incomingCategory && categoryNames[incomingCategory] ? (
            <>
              <Typography variant="h4" weight="bold" style={{ textAlign: 'right' }}>
                {String(categoryNames[incomingCategory] || '')}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right', marginTop: spacing[1] }}>
                {'מורים מומחים בתחום'}
              </Typography>
            </>
          ) : (
            <Typography variant="h4" weight="bold" style={{ textAlign: 'right' }}>
              {'מה נלמד היום? 🎓'}
            </Typography>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={colors.gray[600]} />
          <TextInput
            style={styles.searchInput}
            placeholder="חפש מורה, נושא או עיר..."
            placeholderTextColor={colors.gray[500]}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
              <X size={18} color={colors.gray[600]} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFiltersModal(true)}>
            <SlidersHorizontal size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Popular Subjects - Horizontal Scroll */}
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={popularSubjects}
            keyExtractor={(item) => String(item.id)}
            inverted={isRTL}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === item.id && styles.categoryPillActive
                ]}
                onPress={() => handleCategorySelect(item.id)}
              >
                <View style={styles.categoryContent}>
                  <Typography style={{ fontSize: 12, marginHorizontal: spacing[1] }}>
                    {String(item.icon || '')}
                  </Typography>
                  <Typography
                    variant="caption"
                    weight={selectedCategory === item.id ? 'semibold' : 'normal'}
                    color={selectedCategory === item.id ? 'primary' : 'text'}
                  >
                    {String(item.name || '')}
                  </Typography>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

      </View>

      {/* Content */}
      {!hasActiveFilters ? (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Typography variant="h6" weight="semibold" style={{ marginBottom: spacing[2], textAlign: 'right' }}>
                {'חיפושים אחרונים'}
              </Typography>
              <View style={[{ flexDirection: getFlexDirection(), flexWrap: 'wrap' }]}>
                {recentSearches.map((search, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.recentSearchChip}
                    onPress={() => handleRecentSearch(search)}
                  >
                    <Typography variant="caption" color="text" weight="medium">
                      {String(search || '')}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Trending */}
          <View style={styles.trendingSection}>
            <View style={[{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[3] }]}>
              <TrendingUp size={20} color={colors.primary[600]} />
              <Typography variant="h6" weight="semibold" style={{ marginHorizontal: spacing[2], textAlign: 'right' }}>
                {'מורים פופולריים השבוע'}
              </Typography>
            </View>
            {mockTeachers.slice(0, 3).map((teacher) => (
              <View key={teacher.id}>
                {renderTeacherCard({ item: teacher })}
              </View>
            ))}
          </View>

          {/* Show all teachers only when "הכל" category is selected */}
          {selectedCategory === 'all' && (
            <View style={styles.trendingSection}>
              <View style={[{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[3] }]}>
                <Typography variant="h6" weight="semibold" style={{ marginHorizontal: spacing[2], textAlign: 'right' }}>
                  כל המורים הזמינים
                </Typography>
              </View>
              {mockTeachers.map((teacher) => (
                <View key={teacher.id}>
                  {renderTeacherCard({ item: teacher })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        /* Search Results */
        <View style={styles.searchResults}>
          {/* Results header */}
          {!isSearching && (
            <View style={styles.resultHeader}>
              <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
                {filteredTeachers.length > 0
                  ? `נמצאו ${String(filteredTeachers.length)} מורים`
                  : 'לא נמצאו תוצאות'}
              </Typography>
            </View>
          )}

          {/* Loading state */}
          {isSearching ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[3] }}>
                מחפש...
              </Typography>
            </View>
          ) : filteredTeachers.length > 0 ? (
            /* Results list */
            <FlatList
              data={filteredTeachers}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderTeacherCard}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            /* Empty state */
            <View style={styles.emptyState}>
              <SearchIcon size={48} color={colors.gray[400]} />
              <Typography variant="h5" color="textSecondary" style={{ marginTop: spacing[3] }}>
                {incomingCategory && categoryNames[incomingCategory] 
                  ? `אין מורים זמינים בקטגוריה "${categoryNames[incomingCategory]}"`
                  : 'לא נמצאו מורים'}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: spacing[2], marginHorizontal: spacing[4] }}>
                {incomingCategory 
                  ? 'נסה לבחור קטגוריה אחרת או לחפש נושא ספציפי'
                  : 'נסה לחפש במילים אחרות או לבחור קטגוריה אחרת'}
              </Typography>
              {incomingCategory && (
                <TouchableOpacity 
                  onPress={clearAllFilters}
                  style={{
                    marginTop: spacing[4],
                    backgroundColor: colors.primary[600],
                    paddingHorizontal: spacing[5],
                    paddingVertical: spacing[3],
                    borderRadius: 12,
                  }}
                >
                  <Typography variant="body2" color="white" weight="semibold">
                    {'חזור לכל הקטגוריות'}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Modal for Filters */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, maxHeight: Dimensions.get('window').height * 0.92 }}
          >
            {/* Header - Fixed */}
            <View style={{ 
              flexDirection: isRTL ? 'row-reverse' : 'row',
              padding: spacing[4],
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[200],
              alignItems: 'center',
              backgroundColor: colors.white,
              zIndex: 10,
              elevation: 3,
            }}>
              <TouchableOpacity
                onPress={() => setShowFiltersModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ padding: spacing[2] }}
              >
                <X size={28} color={colors.gray[700]} />
              </TouchableOpacity>
              <Typography variant="h4" weight="bold" style={{ flex: 1, textAlign: 'center', fontSize: 18 }}>
                סינון מתקדם
              </Typography>
              <View style={{ width: 44 }} />
            </View>

            {/* Content - Scrollable */}
            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ padding: spacing[4], paddingBottom: insets.bottom + 100 }}
              showsVerticalScrollIndicator={false}
            >
            
            {/* City Section */}
            <View style={{ marginBottom: spacing[6] }}>
              <Typography variant="h6" weight="bold" style={{ marginBottom: spacing[2], fontSize: 16, color: colors.gray[900] }}>
                בחר אזור
              </Typography>
              <View style={{
                flexDirection: 'row-reverse',
                flexWrap: 'wrap',
                marginHorizontal: -spacing[1]
              }}>
                {/* "All" option */}
                <TouchableOpacity
                  key="all"
                  style={{
                    margin: spacing[1],
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[1],
                    backgroundColor: !selectedRegion ? colors.primary[600] : colors.gray[100],
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: !selectedRegion ? colors.primary[600] : 'transparent',
                    alignItems: 'center',
                    minHeight: 36,
                    justifyContent: 'center',
                    alignSelf: 'flex-start'
                  }}
                  onPress={() => setSelectedRegion(null)}
                >
                  <Typography
                    variant="body2"
                    weight="semibold"
                    color={!selectedRegion ? 'white' : 'text'}
                    style={{ fontSize: 12, textAlign: 'center' }}
                  >
                    הכל
                  </Typography>
                </TouchableOpacity>

                {/* Region options */}
                {regions.map((region) => (
                  <TouchableOpacity
                    key={region.id}
                    style={{
                      margin: spacing[1],
                      paddingHorizontal: spacing[2],
                      paddingVertical: spacing[1],
                      backgroundColor: selectedRegion === region.id ? colors.primary[600] : colors.gray[100],
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: selectedRegion === region.id ? colors.primary[600] : 'transparent',
                      alignItems: 'center',
                      minHeight: 36,
                      justifyContent: 'center',
                      alignSelf: 'flex-start'
                    }}
                    onPress={() => setSelectedRegion(region.id)}
                  >
                    <Typography
                      variant="body2"
                      weight="semibold"
                      color={selectedRegion === region.id ? 'white' : 'text'}
                      style={{ fontSize: 12, textAlign: 'center' }}
                    >
                      {region.name_he}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Section */}
            <View style={{ marginBottom: spacing[6] }}>
              <Typography variant="h6" weight="bold" style={{ marginBottom: spacing[2], fontSize: 16, color: colors.gray[900] }}>
                טווח מחירים
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: spacing[2], fontSize: 14 }}>
                {`₪${priceRange[0]} - ₪${priceRange[1]} לשעה`}
              </Typography>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', marginHorizontal: -spacing[1] }}>
                <TouchableOpacity
                  style={{
                    margin: spacing[1],
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[1],
                    backgroundColor: priceRange[0] === 50 && priceRange[1] === 150 ? colors.primary[600] : colors.gray[100],
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: priceRange[0] === 50 && priceRange[1] === 150 ? colors.primary[600] : 'transparent',
                    alignItems: 'center',
                    minHeight: 36,
                    justifyContent: 'center',
                    alignSelf: 'flex-start'
                  }}
                  onPress={() => setPriceRange([50, 150])}
                >
                  <Typography variant="body2" weight="semibold" color={priceRange[0] === 50 && priceRange[1] === 150 ? 'white' : 'text'} style={{ fontSize: 12 }}>
                    ₪50-150
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    margin: spacing[1],
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[1],
                    backgroundColor: priceRange[0] === 150 && priceRange[1] === 200 ? colors.primary[600] : colors.gray[100],
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: priceRange[0] === 150 && priceRange[1] === 200 ? colors.primary[600] : 'transparent',
                    alignItems: 'center',
                    minHeight: 36,
                    justifyContent: 'center',
                    alignSelf: 'flex-start'
                  }}
                  onPress={() => setPriceRange([150, 200])}
                >
                  <Typography variant="body2" weight="semibold" color={priceRange[0] === 150 && priceRange[1] === 200 ? 'white' : 'text'} style={{ fontSize: 12 }}>
                    ₪150-200
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    margin: spacing[1],
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[1],
                    backgroundColor: priceRange[0] === 200 && priceRange[1] === 300 ? colors.primary[600] : colors.gray[100],
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: priceRange[0] === 200 && priceRange[1] === 300 ? colors.primary[600] : 'transparent',
                    alignItems: 'center',
                    minHeight: 36,
                    justifyContent: 'center',
                    alignSelf: 'flex-start'
                  }}
                  onPress={() => setPriceRange([200, 300])}
                >
                  <Typography variant="body2" weight="semibold" color={priceRange[0] === 200 && priceRange[1] === 300 ? 'white' : 'text'} style={{ fontSize: 12 }}>
                    ₪200+
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rating Section */}
            <View style={{ marginBottom: spacing[6] }}>
              <Typography variant="h6" weight="bold" style={{ marginBottom: spacing[2], fontSize: 16, color: colors.gray[900] }}>
                דירוג מינימלי
              </Typography>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', marginHorizontal: -spacing[1] }}>
                {ratings.map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={{
                      margin: spacing[1],
                      paddingHorizontal: spacing[2],
                      paddingVertical: spacing[1],
                      backgroundColor: selectedRating === rating ? colors.primary[600] : colors.gray[100],
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: selectedRating === rating ? colors.primary[600] : 'transparent',
                      alignItems: 'center',
                      minHeight: 36,
                      justifyContent: 'center',
                      flexDirection: 'row-reverse',
                      alignSelf: 'flex-start'
                    }}
                    onPress={() => setSelectedRating(selectedRating === rating ? null : rating)}
                  >
                    <Star
                      size={14}
                      color={selectedRating === rating ? colors.white : colors.warning[500]}
                      fill={selectedRating === rating ? colors.white : colors.warning[500]}
                    />
                    <Typography 
                      variant="body2" 
                      weight="semibold" 
                      color={selectedRating === rating ? 'white' : 'text'} 
                      style={{ marginLeft: spacing[1], fontSize: 12 }}
                    >
                      {rating}+ ומעלה
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </ScrollView>

          {/* Footer - Fixed */}
          <View style={{ 
            padding: spacing[4],
            borderTopWidth: 1,
            borderTopColor: colors.gray[200],
            backgroundColor: colors.white,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary[600],
                paddingVertical: spacing[4],
                paddingHorizontal: spacing[4],
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: spacing[2]
              }}
              onPress={() => setShowFiltersModal(false)}
            >
              <Typography variant="h6" color="white" weight="bold" style={{ fontSize: 16 }}>
                החל סינון ({filteredTeachers.length} מורים)
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'transparent',
                paddingVertical: spacing[3],
                alignItems: 'center'
              }}
              onPress={clearAllFilters}
            >
              <Typography variant="body2" color="textSecondary" weight="semibold" style={{ fontSize: 14 }}>
                נקה את כל הסינונים
              </Typography>
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = createStyle({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
    marginLeft: spacing[2],
  },
  clearButton: {
    padding: spacing[1],
  },
  filterButton: {
    padding: spacing[2],
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginLeft: spacing[2],
  },
  categoriesContainer: {
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
  },
  categoryChip: {
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    marginRight: spacing[2],
  },
  categoryChipActive: {
    backgroundColor: colors.primary[600],
  },
  recentContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  recentItem: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  resultHeader: {
    paddingVertical: spacing[3],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing[8],
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  modalCloseButton: {
    padding: spacing[2],
    marginLeft: spacing[2],
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    backgroundColor: colors.gray[50],
  },
  filterSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterRow: {
    // marginVertical removed - handled by filterSection
  },
  filterChip: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  priceRangeContainer: {
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  priceButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    marginRight: spacing[2],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  priceButtonActive: {
    backgroundColor: colors.primary[600],
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
  },
  modalActions: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  applyFiltersButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
    flex: 1,
  },
});