import { useQuery } from '@tanstack/react-query';
import { getFeaturedTeachers, getTeachers } from '@/services/api';

export type TeacherListItem = {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  hourlyRate: number | null;
  subjects: string[];
  rating?: number;
  totalReviews?: number;
  location?: string;
  experienceYears?: number;
  totalStudents?: number;
};

function mapApiTeacherToListItem(row: any): TeacherListItem {
  const subjects = Array.isArray(row.subject_names)
    ? row.subject_names.filter((s: any) => typeof s === 'string' && s.trim())
    : Array.isArray(row.subjects)
    ? row.subjects.filter((s: any) => typeof s === 'string' && s.trim())
    : [];

  return {
    id: row.id,
    displayName: row.display_name || 'לא ידוע',
    bio: row.bio || '',
    avatarUrl: row.avatar_url,
    hourlyRate: row.hourly_rate || null,
    subjects,
    rating: row.avg_rating || row.rating_avg || 0,
    totalReviews: row.review_count || row.reviews_count || 0,
    location: row.city?.name_he || row.location || '',
    experienceYears: row.experience_years || 0,
    totalStudents: row.total_students || 0,
  };
}

export function useRecommendedTeachers(options?: { limit?: number; orderBy?: 'rating' | 'reviews' | 'recent' }) {
  const limit = options?.limit ?? 20;
  return useQuery({
    queryKey: ['teachers', 'recommended', { limit, orderBy: options?.orderBy }],
    queryFn: async () => {
      // Current API orders by rating/total_students; we can refine later
      const rows = await getFeaturedTeachers(limit);
      return rows.map(mapApiTeacherToListItem);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

export type SearchTeachersFilters = {
  query?: string;
  subjects?: string[];
  location?: string;
  regionId?: string;
  cityId?: string;
  minRate?: number;
  maxRate?: number;
  sortBy?: 'rating' | 'price_low' | 'price_high' | 'reviews';
  limit?: number;
  offset?: number;
};

export function useSearchTeachers(filters: SearchTeachersFilters) {
  const params = {
    subjectIds: filters.subjects,  // העבר מערך במקום אחד
    location: filters.location,
    regionId: filters.regionId,
    cityId: filters.cityId,
    minRate: filters.minRate,
    maxRate: filters.maxRate,
    searchQuery: filters.query,
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
  } as const;

  return useQuery({
    queryKey: ['teachers', 'search', params],
    queryFn: async () => {
      const { teachers } = await getTeachers(params as any);
      return teachers.map(mapApiTeacherToListItem);
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}


