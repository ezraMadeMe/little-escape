const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',  // ngrok 경고 페이지 우회
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // --- Request Logging Start ---
  console.log('API Request - URL:', `${API_BASE_URL}${endpoint}`);
  console.log('API Request - Method:', options.method || 'GET');
  console.log('API Request - Headers:', headers);
  if (options.body) {
    console.log('API Request - Body:', options.body);
  }
  // --- Request Logging End ---

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  console.log('API Response - URL:', `${API_BASE_URL}${endpoint}`);
  console.log('API Response - Content-Type:', contentType);
  console.log('API Response - Content-Length:', contentLength);
  console.log('API Response - Status:', response.status);

  // If no content or content-length is 0, return undefined (void)
  if (contentLength === '0' || !contentType?.includes('application/json')) {
    const text = await response.text();
    console.log('API Response - Non-JSON content (first 500 chars):', text.substring(0, 500));

    // If we get HTML instead of JSON, it's likely an authentication error
    if (contentType?.includes('text/html')) {
      throw new Error('Authentication failed - received HTML instead of JSON. Backend may have redirected to login.');
    }

    return undefined as T;
  }

  const data = await response.json();
  console.log('API Response - Parsed JSON:', data);
  return data;
}
