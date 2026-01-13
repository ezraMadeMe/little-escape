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

  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  console.log('API Response - URL:', `${API_BASE_URL}${endpoint}`);
  console.log('API Response - Content-Type:', contentType);
  console.log('API Response - Content-Length:', contentLength);
  console.log('API Response - Status:', response.status);

  // If we get HTML instead of JSON, it's likely an authentication error
  if (response.ok && contentType?.includes('text/html')) {
    const text = await response.text();
    console.log('API Response - Non-JSON content (first 500 chars):', text.substring(0, 500));
    
    console.error('❌ 인증 실패: HTML 로그인 페이지 응답 받음');
    localStorage.removeItem('token'); // 유효하지 않은 토큰 제거
    window.location.href = '/login'; // 로그인 페이지로 리다이렉트
    throw new Error('Authentication failed - received HTML instead of JSON. Redirecting to login...');
  }

  if (!response.ok) {
    // 401 Unauthorized - 인증 실패
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - 로그인 필요');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized - Please login again');
    }

    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  // If no content or content-length is 0, return undefined (void)
  if (contentLength === '0' || !contentType?.includes('application/json')) {
    const text = await response.text();
    console.log('API Response - Non-JSON content (first 500 chars):', text.substring(0, 500));
    return undefined as T;
  }

  const data = await response.json();
  console.log('API Response - Parsed JSON:', data);
  return data;
}
