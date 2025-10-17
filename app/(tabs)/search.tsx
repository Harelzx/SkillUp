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
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getTeachers, getSubjects } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('הכל');
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

  // Fetch teachers from API with filters
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', selectedCategory, selectedCity, priceRange, selectedRating],
    queryFn: async () => {
      const params: any = {
        limit: 100,
      };

      // Add subject filter
      if (selectedCategory && selectedCategory !== 'all') {
        // Find subject ID from name
        const subject = subjects.find(s => s.name_he === selectedCategory);
        if (subject) {
          params.subjectId = subject.id;
        }
      }

      // Add location filter
      if (selectedCity && selectedCity !== 'הכל') {
        params.location = selectedCity;
      }

      // Add price range filter
      params.minRate = priceRange[0];
      params.maxRate = priceRange[1];

      // Don't send searchQuery to API - filter client-side instead
      // This allows searching in subjects (which are arrays)

      const result = await getTeachers(params);
      return result.teachers.map((t: any) => {
        const subjects = Array.isArray(t.subject_names)
          ? t.subject_names.filter((s: any) => typeof s === 'string' && s.trim())
          : [];

        return {
          id: t.id,
          displayName: t.display_name || 'לא ידוע',
          bio: t.bio || '',
          avatarUrl: t.avatar_url,
          hourlyRate: t.hourly_rate || 0,
          subjects: subjects,
          rating: t.avg_rating || 0,
          totalReviews: t.review_count || 0,
          location: t.location || '',
          experienceYears: t.experience_years || 0,
          totalStudents: t.total_students || 0,
        };
      });
    },
  });

  const mockTeachers: Teacher[] = teachersData || [];

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'מתמטיקה לבגרות',
    'אנגלית מדוברת',
    'פסנתר למתחילים',
  ]);

  const cities = ['הכל', 'תל אביב', 'רמת גן', 'ירושלים', 'הרצליה', 'חיפה', 'פתח תקווה'];
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

  // Advanced filtering logic
  const filteredTeachers = useMemo(() => {
    let results = mockTeachers;

    // Filter by incoming category (from navigation)
    if (incomingCategory && categorySubjectsMap[incomingCategory]) {
      const allowedSubjects = categorySubjectsMap[incomingCategory];
      results = results.filter(teacher =>
        Array.isArray(teacher.subjects) && teacher.subjects.some(subject => allowedSubjects.includes(String(subject)))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(teacher => {
        const nameMatch = (teacher.displayName || '').toLowerCase().includes(query);
        const bioMatch = (teacher.bio || '').toLowerCase().includes(query);
        const subjectMatch = Array.isArray(teacher.subjects) && teacher.subjects.some(s => String(s).toLowerCase().includes(query));
        const locationMatch = teacher.location && teacher.location.toLowerCase().includes(query);
        return nameMatch || bioMatch || subjectMatch || locationMatch;
      });
    }

    // Filter by category (from local selection)
    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(teacher =>
        Array.isArray(teacher.subjects) && teacher.subjects.some(s => String(s) === String(selectedCategory))
      );
    }

    // Filter by city
    if (selectedCity && selectedCity !== 'הכל') {
      results = results.filter(teacher =>
        teacher.location === selectedCity
      );
    }

    // Filter by price range
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
  }, [mockTeachers, incomingCategory, searchQuery, selectedCategory, selectedCity, priceRange, selectedRating, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = incomingCategory || searchQuery || (selectedCategory && selectedCategory !== 'all') ||
                          (selectedCity && selectedCity !== 'הכל') ||
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
    setSelectedCity('הכל');
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
    const safeBio = String(item.bio || '');
    const safeRate = Number(item.hourlyRate) || 0;
    const safeRating = Number(item.rating) || 0;
    const safeReviews = Number(item.totalReviews) || 0;

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
          <View style={[styles.teacherRow, { flexDirection: getFlexDirection() }]}>
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

            {/* Info */}
            <View style={styles.teacherInfo}>
              <Typography variant="body1" weight="semibold" numberOfLines={1} style={{ textAlign: 'right' }}>
                {safeName}
              </Typography>
              <Typography variant="caption" color="textSecondary" numberOfLines={2} style={{ textAlign: 'right' }}>
                {safeBio}
              </Typography>

              {/* Subjects */}
              {safeSubjects.length > 0 && (
                <View style={[styles.subjectsRow, { flexDirection: 'row-reverse', justifyContent: 'flex-start' }]}>
                  {safeSubjects.slice(0, 2).map((subject, idx) => (
                    <View key={idx} style={styles.subjectBadge}>
                      <Typography variant="caption" color="primary" style={{ fontSize: 10 }}>
                        {subject}
                      </Typography>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Price & Rating */}
            <View style={styles.teacherMeta}>
              <View style={[styles.ratingRow, { flexDirection: 'row', justifyContent: 'flex-start' }]}>
                {safeRating > 0 ? (
                  <>
                    <Typography variant="caption" style={{ marginLeft: 2 }}>
                      {`(${safeReviews})`}
                    </Typography>
                    <Typography variant="caption" style={{ marginHorizontal: 2 }}>
                      {safeRating.toFixed(1)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" color="textSecondary" style={{ marginHorizontal: 2 }}>
                    {'חדש'}
                  </Typography>
                )}
                <View style={{ marginRight: 2 }}>
                  <Star size={12} color={colors.warning[500]} fill={colors.warning[500]} />
                </View>
              </View>
              <Typography variant="body2" weight="semibold" color="primary" style={{ textAlign: 'right', marginTop: spacing[1] }}>
                {`₪${safeRate}/שעה`}
              </Typography>
              {item.nextAvailable && (
                <Typography variant="caption" color="success" style={{ marginTop: 2, textAlign: 'right' }}>
                  {String(item.nextAvailable || '')}
                </Typography>
              )}
            </View>
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
      marginBottom: spacing[3],
    },
    categoryPill: {
      backgroundColor: colors.white,
      borderRadius: 20,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
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
      borderRadius: 16,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1] + 2,
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      marginBottom: spacing[2],
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
    },
    teacherRow: {
      alignItems: 'center',
    },
    teacherAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
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
      backgroundColor: colors.primary[50],
      borderRadius: 12,
      paddingHorizontal: spacing[2],
      paddingVertical: 2,
      marginLeft: spacing[1],
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
      borderRadius: 20,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      marginRight: isRTL ? 0 : spacing[2],
      marginLeft: isRTL ? spacing[2] : 0,
      flexDirection: 'row',
      alignItems: 'center',
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
                  <Typography style={{ fontSize: 16, marginHorizontal: spacing[1] }}>
                    {String(item.icon || '')}
                  </Typography>
                  <Typography
                    variant="body2"
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
        <ScrollView>
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
                    <Typography variant="body2" color="text">
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typography variant="h6" weight="semibold" style={{ textAlign: 'center', flex: 1 }}>
              סינון וחיפוש מתקדם
            </Typography>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <X size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* City Filter */}
            <View style={styles.filterRow}>
              <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2] }}>
                עיר
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[{ flexDirection: getFlexDirection() }]}>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.filterChip,
                        selectedCity === city && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedCity(city)}
                    >
                      <Typography
                        variant="caption"
                        color={selectedCity === city ? 'white' : 'text'}
                      >
                        {String(city)}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Price Range */}
            <View style={styles.filterRow}>
              <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2] }}>
                {`טווח מחירים: ₪${priceRange[0]} - ₪${priceRange[1]} לשעה`}
              </Typography>
              <View style={styles.priceRangeContainer}>
                <TouchableOpacity
                  style={[
                    styles.priceButton,
                    priceRange[0] === 50 && priceRange[1] === 150 && styles.priceButtonActive
                  ]}
                  onPress={() => setPriceRange([50, 150])}
                >
                  <Typography
                    variant="caption"
                    color={priceRange[0] === 50 && priceRange[1] === 150 ? 'white' : 'text'}
                  >
                    {'₪50-150'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priceButton,
                    priceRange[0] === 150 && priceRange[1] === 200 && styles.priceButtonActive
                  ]}
                  onPress={() => setPriceRange([150, 200])}
                >
                  <Typography
                    variant="caption"
                    color={priceRange[0] === 150 && priceRange[1] === 200 ? 'white' : 'text'}
                  >
                    {'₪150-200'}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priceButton,
                    priceRange[0] === 200 && priceRange[1] === 300 && styles.priceButtonActive
                  ]}
                  onPress={() => setPriceRange([200, 300])}
                >
                  <Typography
                    variant="caption"
                    color={priceRange[0] === 200 && priceRange[1] === 300 ? 'white' : 'text'}
                  >
                    {'₪200+'}
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.filterRow}>
              <Typography variant="body2" weight="semibold" style={{ marginBottom: spacing[2] }}>
                {'דירוג מינימלי'}
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[{ flexDirection: getFlexDirection() }]}>
                  {ratings.map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingChip,
                        selectedRating === rating && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    >
                      <Star
                        size={14}
                        color={selectedRating === rating ? colors.white : colors.warning[500]}
                        fill={selectedRating === rating ? colors.white : colors.warning[500]}
                      />
                      <Typography
                        variant="caption"
                        color={selectedRating === rating ? 'white' : 'text'}
                        style={{ marginLeft: spacing[1] }}
                      >
                        {`${rating}+`}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Clear Filters */}
            {(selectedCity !== 'הכל' || priceRange[0] !== 50 || priceRange[1] !== 300 || selectedRating) && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Typography variant="caption" color="textSecondary" weight="medium">
                  {'נקה פילטרים'}
                </Typography>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <Typography variant="body2" color="white" weight="semibold">
                {`החל פילטרים (${filteredTeachers.length} מורים)`}
              </Typography>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.gray[100],
    borderRadius: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalCloseButton: {
    padding: spacing[2],
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  filterRow: {
    marginVertical: spacing[4],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    marginRight: spacing[2],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  priceRangeContainer: {
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  priceButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    marginRight: spacing[2],
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
  },
  applyFiltersButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    alignItems: 'center',
  },
});