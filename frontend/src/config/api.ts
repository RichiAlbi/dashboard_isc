/**
 * API configuration and base fetch wrapper
 */

// Get API base URL from runtime config (Docker) or environment variable (dev)
export const getApiBaseUrl = (): string => {
  // Check for runtime config (injected by Docker at container start)
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.VITE_API_BASE_URL) {
    return (window as any).__RUNTIME_CONFIG__.VITE_API_BASE_URL;
  }
  // Fallback to Vite env variable (for local development)
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const apiConfig = {
  baseURL: API_BASE_URL,
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(
    message: string,
    status?: number,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch wrapper with error handling and JSON parsing
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${apiConfig.baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include session cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    // Parse JSON response
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors or other fetch errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      undefined,
      error
    );
  }
}
