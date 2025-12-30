/**
 * API Configuration and Client
 * Central configuration for backend API calls
 */

// Get API base URL from environment variable or use localhost for development
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:8000';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  root: `${API_BASE_URL}/`,
  analyze: `${API_BASE_URL}/analyze`,
  recommendations: `${API_BASE_URL}/api/recommendations`,
  atRiskRecommendations: `${API_BASE_URL}/api/recommendations/at-risk`,
  students: `${API_BASE_URL}/api/students`,
} as const;

/**
 * API Client - Generic fetch wrapper with error handling
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Upload file (multipart/form-data)
   */
  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Type-safe API methods
 */

export interface Recommendation {
  course_id: string;
  course_name: string;
  score: number;
  reason?: string;
}

export interface Student {
  id: string;
  name: string;
  gpa: number;
  attendance: number;
  risk_level: string;
  risk_score: number;
}

/**
 * Get course recommendations for a user
 */
export async function getRecommendations(
  userId: string,
  topN: number = 5
): Promise<Recommendation[]> {
  const data = await apiClient.get<{ recommendations: Recommendation[] }>(
    '/api/recommendations',
    { user_id: userId, top_n: topN.toString() }
  );
  return data.recommendations;
}

/**
 * Get recommendations for at-risk students
 */
export async function getAtRiskRecommendations(
  userId: string,
  riskFactors: Record<string, boolean>,
  topN: number = 5
): Promise<Recommendation[]> {
  const data = await apiClient.post<{ recommendations: Recommendation[] }>(
    '/api/recommendations/at-risk',
    { user_id: userId, risk_factors: riskFactors, top_n: topN }
  );
  return data.recommendations;
}

/**
 * Get all students with risk data
 */
export async function getStudents(): Promise<Student[]> {
  return apiClient.get<Student[]>('/api/students');
}

/**
 * Analyze uploaded CSV file
 */
export async function analyzeCSV(file: File): Promise<unknown> {
  return apiClient.uploadFile('/analyze', file);
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ message: string; version: string }> {
  return apiClient.get('/');
}
