const API_BASE_URL = `http://${window.location.hostname}:8080`;

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  // If no content or content-length is 0, return undefined (void)
  if (contentLength === '0' || !contentType?.includes('application/json')) {
    return undefined as T;
  }

  return response.json();
}
