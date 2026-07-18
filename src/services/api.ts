// src/services/api.ts

import type { Category, PaginatedCategories } from '../types';

const DEFAULT_API_BASE_URL = '/backend-api';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  [key: string]: unknown;
}

const getApiErrorMessage = (responseBody: LoginResponse, fallback: string): string => {
  const validationErrors = responseBody.validationErrors;
  if (validationErrors && typeof validationErrors === 'object') {
    for (const value of Object.values(validationErrors)) {
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
      if (typeof value === 'string') return value;
    }
  }

  return typeof responseBody.message === 'string' && responseBody.message
    ? responseBody.message
    : fallback;
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(credentials),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Máy chủ phản hồi quá lâu. Vui lòng thử đăng nhập lại.');
    }
    throw new Error('Không thể kết nối đến máy chủ đăng nhập.');
  } finally {
    window.clearTimeout(timeout);
  }

  const rawBody = await response.text();
  let responseBody: LoginResponse = {};

  if (rawBody) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      responseBody = parsed !== null && typeof parsed === 'object'
        ? parsed as LoginResponse
        : { message: String(parsed) };
    } catch {
      responseBody = { message: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, 'Email hoặc mật khẩu không chính xác.'));
  }

  return responseBody;
};

export const loginWithGoogle = async (idToken: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/Auth/google-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ idToken })
  });

  const rawBody = await response.text();
  let responseBody: LoginResponse = {};

  if (rawBody) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      responseBody = parsed !== null && typeof parsed === 'object'
        ? parsed as LoginResponse
        : { message: String(parsed) };
    } catch {
      responseBody = { message: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, 'Không thể đăng nhập bằng Google.'));
  }

  return responseBody;
};

export interface RefreshTokenCredentials {
  token: string;
  refreshToken: string;
}

export const refreshAuthToken = async (
  credentials: RefreshTokenCredentials
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/Auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  const rawBody = await response.text();
  let responseBody: LoginResponse = {};

  if (rawBody) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      responseBody = parsed !== null && typeof parsed === 'object'
        ? parsed as LoginResponse
        : { message: String(parsed) };
    } catch {
      responseBody = { message: rawBody };
    }
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(responseBody, 'Không thể làm mới phiên đăng nhập.'));
  }

  return responseBody;
};

export interface CategoryQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  apiVersion?: string;
}

const getStoredAuthToken = () => localStorage.getItem('orchidee_auth_token')
  || sessionStorage.getItem('orchidee_auth_token');

export const getCategories = async (
  query: CategoryQuery = {}
): Promise<PaginatedCategories> => {
  const params = new URLSearchParams();
  params.set('PageNumber', String(query.pageNumber ?? 1));
  params.set('PageSize', String(query.pageSize ?? 100));
  if (query.searchTerm) params.set('SearchTerm', query.searchTerm);
  if (query.sortBy) params.set('SortBy', query.sortBy);
  if (query.sortDescending !== undefined) {
    params.set('SortDescending', String(query.sortDescending));
  }
  if (query.apiVersion) params.set('api-version', query.apiVersion);

  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/Categories?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error('Không thể tải danh sách danh mục.');
  }

  const data = await response.json() as Omit<PaginatedCategories, 'items'> & {
    items?: Array<Partial<Category> & { id: string; name: string }>;
  };

  return {
    ...data,
    items: (data.items ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      scientificName: category.scientificName,
      description: category.description ?? '',
      orchidCount: category.orchidCount ?? 0,
      slug: category.slug,
      parentId: category.parentId,
    })),
  };
};

export interface CreateCategoryPayload {
  name: string;
  description: string;
  slug: string;
  parentId: string | null;
}

export interface UpdateCategoryPayload extends CreateCategoryPayload {
  id: string;
}

const parseCategoryResponse = (category: Partial<Category> & { id: string; name: string }): Category => ({
  id: category.id,
  name: category.name,
  scientificName: category.scientificName,
  description: category.description ?? '',
  orchidCount: category.orchidCount ?? 0,
  slug: category.slug,
  parentId: category.parentId,
});

const readApiResponse = async (response: Response): Promise<unknown> => {
  const rawBody = await response.text();
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

const throwCategoryApiError = (body: unknown, fallback: string): never => {
  const errorBody = body !== null && typeof body === 'object'
    ? body as LoginResponse
    : {};
  throw new Error(getApiErrorMessage(errorBody, fallback));
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<unknown> => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/Categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  const rawBody = await response.text();
  let responseBody: unknown = null;
  if (rawBody) {
    try {
      responseBody = JSON.parse(rawBody);
    } catch {
      responseBody = rawBody;
    }
  }

  if (!response.ok) {
    const errorBody = responseBody !== null && typeof responseBody === 'object'
      ? responseBody as LoginResponse
      : {};
    throw new Error(getApiErrorMessage(errorBody, 'Không thể tạo danh mục mới.'));
  }

  return responseBody;
};

export const getCategoryById = async (id: string, apiVersion?: string): Promise<Category> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/Categories/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
    {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );
  const body = await readApiResponse(response);
  if (!response.ok) throwCategoryApiError(body, 'Không thể tải thông tin danh mục.');
  return parseCategoryResponse(body as Partial<Category> & { id: string; name: string });
};

export const updateCategory = async (
  id: string,
  payload: UpdateCategoryPayload,
  apiVersion?: string
): Promise<unknown> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/Categories/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ...payload, id })
    }
  );
  const body = await readApiResponse(response);
  if (!response.ok) throwCategoryApiError(body, 'Không thể cập nhật danh mục.');
  return body;
};

export const deleteCategory = async (id: string, apiVersion?: string): Promise<void> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/Categories/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );
  const body = await readApiResponse(response);
  if (!response.ok) throwCategoryApiError(body, 'Không thể xóa danh mục.');
};

export const getDocuments = async (pageNumber: number = 1, pageSize: number = 10) => {
  const response = await fetch(`${API_BASE_URL}/api/Documents?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
};

export const createDocument = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/Documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to create document');
  }
  return response.json();
};

export const deleteDocument = async (id: string | number) => {
  const response = await fetch(`${API_BASE_URL}/api/Documents/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
  if (response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};

// ======================= ARTICLES API (Care Guide) =======================

export const getArticles = async () => {
  const response = await fetch(`${API_BASE_URL}/api/Articles`);
  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }
  return response.json();
};

export const getArticleById = async (id: string | number) => {
  const response = await fetch(`${API_BASE_URL}/api/Articles/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch article');
  }
  return response.json();
};

export const createArticle = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/Articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to create article');
  }
  return response.json();
};

export const updateArticle = async (id: string | number, data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/Articles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to update article');
  }
  if (response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};

export const deleteArticle = async (id: string | number) => {
  const response = await fetch(`${API_BASE_URL}/api/Articles/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete article');
  }
  if (response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};



// ======================= ORCHIDS API =======================

export const getOrchids = async () => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams({ PageNumber: '1', PageSize: '100' });
  const response = await fetch(`${API_BASE_URL}/api/v1/Orchids?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error('Không thể tải danh sách hoa lan.');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.items ?? [];
};

export const getOrchidById = async (id: string | number) => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/Orchids/${id}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch orchid');
  }
  return response.json();
};

export const createOrchid = async (data: any) => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/Orchids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to create orchid');
  }
  return response.json();
};

export const updateOrchid = async (id: string | number, data: any) => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/Orchids/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to update orchid');
  }
  if (response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};

export const deleteOrchid = async (id: string | number) => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/Orchids/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error('Failed to delete orchid');
  }
  if (response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
};
