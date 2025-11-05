// ============================================
// Regions & Cities API
// ============================================
// API functions for fetching Israeli regions and cities
// Used for location-based teacher search and profile editing

import { supabase } from '@/lib/supabase';
import type { Region, City } from '@/types/database';

// ============================================
// Get All Regions
// ============================================

export interface GetRegionsResponse {
  success: boolean;
  regions: Region[];
  error?: string;
}

/**
 * Fetch all Israeli regions
 * Returns 9 regions sorted by display order
 */
export async function getRegions(): Promise<GetRegionsResponse> {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[regionsAPI] Error fetching regions:', error);
      return {
        success: false,
        regions: [],
        error: error.message,
      };
    }

    return {
      success: true,
      regions: data || [],
    };
  } catch (error: any) {
    console.error('[regionsAPI] Unexpected error fetching regions:', error);
    return {
      success: false,
      regions: [],
      error: error.message || 'Failed to fetch regions',
    };
  }
}

// ============================================
// Get Cities by Region
// ============================================

export interface GetCitiesByRegionResponse {
  success: boolean;
  cities: City[];
  error?: string;
}

/**
 * Fetch all cities in a specific region
 * @param regionId - UUID of the region
 */
export async function getCitiesByRegion(
  regionId: string
): Promise<GetCitiesByRegionResponse> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('region_id', regionId)
      .order('sort_order', { ascending: true })
      .order('name_he', { ascending: true });

    if (error) {
      console.error('[regionsAPI] Error fetching cities:', error);
      return {
        success: false,
        cities: [],
        error: error.message,
      };
    }

    return {
      success: true,
      cities: data || [],
    };
  } catch (error: any) {
    console.error('[regionsAPI] Unexpected error fetching cities:', error);
    return {
      success: false,
      cities: [],
      error: error.message || 'Failed to fetch cities',
    };
  }
}

// ============================================
// Get All Cities
// ============================================

export interface GetAllCitiesResponse {
  success: boolean;
  cities: (City & { region?: Region })[];
  error?: string;
}

/**
 * Fetch all cities with their region information
 * Useful for dropdown lists that show "City (Region)"
 */
export async function getAllCities(): Promise<GetAllCitiesResponse> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select(`
        *,
        region:regions(*)
      `)
      .order('name_he', { ascending: true });

    if (error) {
      console.error('[regionsAPI] Error fetching all cities:', error);
      return {
        success: false,
        cities: [],
        error: error.message,
      };
    }

    return {
      success: true,
      cities: (data || []).map((city: any) => ({
        ...city,
        region: Array.isArray(city.region) ? city.region[0] : city.region,
      })),
    };
  } catch (error: any) {
    console.error('[regionsAPI] Unexpected error fetching all cities:', error);
    return {
      success: false,
      cities: [],
      error: error.message || 'Failed to fetch cities',
    };
  }
}

// ============================================
// Get Region by City
// ============================================

export interface GetRegionByCityResponse {
  success: boolean;
  region: Region | null;
  error?: string;
}

/**
 * Find the region for a specific city
 * @param cityId - UUID of the city
 */
export async function getRegionByCity(
  cityId: string
): Promise<GetRegionByCityResponse> {
  try {
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('region_id')
      .eq('id', cityId)
      .single();

    if (cityError || !city) {
      console.error('[regionsAPI] Error fetching city:', cityError);
      return {
        success: false,
        region: null,
        error: cityError?.message || 'City not found',
      };
    }

    const { data: region, error: regionError } = await supabase
      .from('regions')
      .select('*')
      .eq('id', city.region_id)
      .single();

    if (regionError) {
      console.error('[regionsAPI] Error fetching region:', regionError);
      return {
        success: false,
        region: null,
        error: regionError.message,
      };
    }

    return {
      success: true,
      region: region || null,
    };
  } catch (error: any) {
    console.error('[regionsAPI] Unexpected error fetching region by city:', error);
    return {
      success: false,
      region: null,
      error: error.message || 'Failed to fetch region',
    };
  }
}

// ============================================
// Search Cities by Name
// ============================================

export interface SearchCitiesResponse {
  success: boolean;
  cities: City[];
  error?: string;
}

/**
 * Search cities by Hebrew or English name
 * @param query - Search query (case-insensitive, partial match)
 */
export async function searchCities(query: string): Promise<SearchCitiesResponse> {
  try {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        cities: [],
      };
    }

    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .or(`name_he.ilike.%${query}%,name_en.ilike.%${query}%`)
      .order('name_he', { ascending: true })
      .limit(20);

    if (error) {
      console.error('[regionsAPI] Error searching cities:', error);
      return {
        success: false,
        cities: [],
        error: error.message,
      };
    }

    return {
      success: true,
      cities: data || [],
    };
  } catch (error: any) {
    console.error('[regionsAPI] Unexpected error searching cities:', error);
    return {
      success: false,
      cities: [],
      error: error.message || 'Failed to search cities',
    };
  }
}
