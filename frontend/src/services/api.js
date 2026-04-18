const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('jwt');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // If 401 Unauthorized globally, we could clear storage and redirect here
  if (response.status === 401) {
    localStorage.removeItem('jwt');
    localStorage.removeItem('isAuth');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-expired'));
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = (data && data.error) || response.statusText;
    throw new Error(error);
  }

  return data;
};
