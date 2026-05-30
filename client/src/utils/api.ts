const BASE_URL = '/api';

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
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
  // 认证
  register: (data: { phone: string; password: string; nickname: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { phone: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data: any) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // 好价
  getDeals: (params?: Record<string, string>) => {
    const search = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }>(`/deals${search}`);
  },
  getDeal: (id: string) => request(`/deals/${id}`),
  submitDeal: (data: any) =>
    request('/deals', { method: 'POST', body: JSON.stringify(data) }),
  likeDeal: (id: string) =>
    request(`/deals/${id}/like`, { method: 'POST' }),

  // 分类
  getCategories: () => request('/categories'),

  // 商品
  getProducts: (params?: Record<string, string>) => {
    const search = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/products${search}`);
  },
  getProduct: (id: string) => request(`/products/${id}`),

  // 收藏
  getFavorites: (params?: Record<string, string>) => {
    const search = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/favorites${search}`);
  },
  toggleFavorite: (type: 'deal' | 'product', id: string) =>
    request(`/favorites/${type}/${id}`, { method: 'POST' }),

  // 评论
  getComments: (dealId: string) => request(`/comments/${dealId}`),
  postComment: (dealId: string, content: string, parentId?: string) =>
    request(`/comments/${dealId}`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    }),

  // 京东联盟
  getJdJingfen: (eliteId?: string, page?: string, pageSize?: string) => {
    const params: Record<string, string> = {};
    if (eliteId) params.eliteId = eliteId;
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;
    const search = '?' + new URLSearchParams(params).toString();
    return request(`/jd/jingfen${search}`);
  },
  getJdSearch: (keyword: string, page?: string) => {
    const params: Record<string, string> = { keyword };
    if (page) params.page = page;
    const search = '?' + new URLSearchParams(params).toString();
    return request(`/jd/search${search}`);
  },
  getJdDetail: (skuId: string) => request(`/jd/detail/${skuId}`),
  getJdPromotion: (data: { materialId: string; positionId?: number }) =>
    request('/jd/promotion', { method: 'POST', body: JSON.stringify(data) }),
  getJdCategories: () => request('/jd/categories'),
  syncJdGoods: () => request('/jd/sync', { method: 'POST' }),

  // 统计
  getStats: () => request('/stats'),
};