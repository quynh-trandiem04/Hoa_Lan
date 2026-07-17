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
  const response = await fetch(`${API_BASE_URL}/api/v1/Auth/login`, {
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
