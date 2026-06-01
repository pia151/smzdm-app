const BASE_URL = 'http://localhost:3001/api';

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
}

export const api = {
  getDeals: (params?: Record<string, string>) => {
    const search = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/deals${search}`);
  },
  getDeal: (id: string) => request(`/deals/${id}`),
  getCategories: () => request('/categories'),
  getProducts: (params?: Record<string, string>) => {
    const search = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/products${search}`);
  },
  getProduct: (id: string) => request(`/products/${id}`),
  getFavorites: () => request('/favorites'),
  toggleFavorite: (type: 'deal' | 'product', id: string) =>
    request(`/favorites/${type}/${id}`, { method: 'POST' }),
  getJdJingfen: (eliteId?: string, page?: string, pageSize?: string) => {
    const params: Record<string, string> = {};
    if (eliteId) params.eliteId = eliteId;
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;
    return request(`/jd/jingfen?${new URLSearchParams(params).toString()}`);
  },
  getJdDetail: (skuId: string) => request(`/jd/detail/${skuId}`),
  getJdPromotion: (data: { materialId: string }) =>
    request('/jd/promotion', { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => request('/stats'),
};