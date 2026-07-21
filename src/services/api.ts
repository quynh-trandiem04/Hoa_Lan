// src/services/api.ts

import type { CareArticle, Category, Orchid, PaginatedCategories } from '../types';

const DEFAULT_API_BASE_URL = '/backend-api';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  title?: string;
  detail?: string;
  [key: string]: unknown;
}

const getApiErrorMessage = (responseBody: LoginResponse, fallback: string): string => {
  const validationErrors = responseBody.validationErrors ?? responseBody.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    for (const value of Object.values(validationErrors)) {
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
      if (typeof value === 'string') return value;
    }
  }

  const isGenericServerError = (value: unknown) => typeof value === 'string'
    && value.toLowerCase().includes('lỗi hệ thống cục bộ');
  if (typeof responseBody.message === 'string' && responseBody.message && !isGenericServerError(responseBody.message)) return responseBody.message;
  if (typeof responseBody.detail === 'string' && responseBody.detail && !isGenericServerError(responseBody.detail)) return responseBody.detail;
  if (typeof responseBody.title === 'string' && responseBody.title) return responseBody.title;
  return fallback;
};

const normalizeAuthResponse = (responseBody: LoginResponse): LoginResponse => {
  const nested = responseBody.data ?? responseBody.result;
  return nested !== null && typeof nested === 'object'
    ? { ...responseBody, ...nested as LoginResponse }
    : responseBody;
};

export const register = async (payload: RegisterPayload): Promise<LoginResponse> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Máy chủ phản hồi quá lâu. Vui lòng thử đăng ký lại.');
    }
    throw new Error('Không thể kết nối đến máy chủ đăng ký.');
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

  if (!response.ok || responseBody.success === false) {
    throw new Error(getApiErrorMessage(responseBody, 'Không thể tạo tài khoản mới.'));
  }

  return normalizeAuthResponse(responseBody);
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
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

  return normalizeAuthResponse(responseBody);
};

export const loginWithGoogle = async (idToken: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/Auth/google-login`, {
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

  return normalizeAuthResponse(responseBody);
};

export interface RefreshTokenCredentials {
  token: string;
  refreshToken: string;
}

export const refreshAuthToken = async (
  credentials: RefreshTokenCredentials
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/Auth/refresh-token`, {
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

  return normalizeAuthResponse(responseBody);
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
  const response = await fetch(`${API_BASE_URL}/api/Categories?${params.toString()}`, {
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

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roleName?: string;
}

export interface PaginatedUsers {
  items: UserListItem[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  avatarUrl: string;
}

export interface UpdateUserPayload {
  email: string;
  fullName: string;
  avatarUrl: string;
}

export const getUsers = async (
  pageNumber = 1,
  pageSize = 10,
  searchTerm?: string,
): Promise<PaginatedUsers> => {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm) params.set('SearchTerm', searchTerm);
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Users?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await readApiResponse(response);
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  if (!response.ok) throwCategoryApiError(body, 'Không thể tải danh sách người dùng.');
  const data = body !== null && typeof body === 'object' && 'data' in body
    ? (body as { data: unknown }).data
    : body;
  return data as PaginatedUsers;
};

const userApiRequest = async (path: string, init: RequestInit, fallback: string): Promise<unknown> => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await readApiResponse(response);
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  if (!response.ok || (body !== null && typeof body === 'object' && (body as { success?: boolean }).success === false)) {
    throwCategoryApiError(body, fallback);
  }
  return body;
};

export const getUserById = async (id: string): Promise<UserListItem> => {
  const body = await userApiRequest(
    `/api/Users/${encodeURIComponent(id)}`,
    { method: 'GET' },
    'Không thể tải thông tin người dùng.',
  );
  const data = body !== null && typeof body === 'object' && 'data' in body
    ? (body as { data: unknown }).data
    : body;
  return data as UserListItem;
};

export const createUser = (payload: CreateUserPayload): Promise<unknown> => userApiRequest(
  '/api/Users',
  { method: 'POST', body: JSON.stringify(payload) },
  'Không thể tạo người dùng.',
);

export const updateUser = (id: string, payload: UpdateUserPayload): Promise<unknown> => userApiRequest(
  `/api/Users/${encodeURIComponent(id)}`,
  { method: 'PUT', body: JSON.stringify({ ...payload, id }) },
  'Không thể cập nhật người dùng.',
);

export const deleteUser = async (id: string): Promise<void> => {
  await userApiRequest(
    `/api/Users/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Không thể xóa người dùng.',
  );
};

export const resetUserPassword = async (
  id: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> => {
  await userApiRequest(
    `/api/Users/${encodeURIComponent(id)}/password`,
    { method: 'PUT', body: JSON.stringify({ password: newPassword, confirmPassword }) },
    'Không thể đặt lại mật khẩu người dùng.',
  );
};

const throwCategoryApiError = (body: unknown, fallback: string): never => {
  const errorBody = body !== null && typeof body === 'object'
    ? body as LoginResponse
    : {};
  throw new Error(getApiErrorMessage(errorBody, fallback));
};

export const createCategory = async (payload: CreateCategoryPayload): Promise<unknown> => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Categories`, {
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

  if (response.status === 401) {
    throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại.');
  }
  if (response.status === 403) {
    throw new Error('Tài khoản không có quyền tạo danh mục.');
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
    `${API_BASE_URL}/api/Categories/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
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
    `${API_BASE_URL}/api/Categories/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
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
    `${API_BASE_URL}/api/Categories/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
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

export interface DocumentQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  apiVersion?: string;
}

export interface UploadDocumentPayload {
  file: File;
  title: string;
  description?: string;
  apiVersion?: string;
}

export const getDocuments = async (
  pageNumber: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  apiVersion?: string
): Promise<import('../types').PaginatedDocuments> => {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });
  if (searchTerm) params.set('SearchTerm', searchTerm);
  if (apiVersion) params.set('api-version', apiVersion);
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Documents?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwArticleApiError(body, `Không thể tải danh sách tài liệu (HTTP ${response.status}).`);
  return body as import('../types').PaginatedDocuments;
};

export const createDocument = async ({ file, title, description = '', apiVersion }: UploadDocumentPayload) => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const formData = new FormData();
  formData.append('File', file);
  formData.append('Title', title.trim());
  formData.append('Description', description.trim());
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Documents/upload${params.size ? `?${params.toString()}` : ''}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const body = await readApiResponse(response);
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi tải tài liệu.');
  if (!response.ok) throwArticleApiError(body, `Không thể tải tài liệu lên (HTTP ${response.status}).`);
  return body as import('../types').DocumentItem;
};

export const deleteDocument = async (id: string, apiVersion?: string): Promise<void> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Documents/${encodeURIComponent(id)}${params.size ? `?${params.toString()}` : ''}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await readApiResponse(response);
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi xóa tài liệu.');
  if (!response.ok) throwArticleApiError(body, `Không thể xóa tài liệu (HTTP ${response.status}).`);

  if (body === false) {
    throw new Error('Backend báo không thể xóa tài liệu.');
  }
  if (body !== null && typeof body === 'object') {
    const result = body as LoginResponse & { success?: boolean };
    if (result.success === false) {
      throwArticleApiError(body, 'Backend báo không thể xóa tài liệu.');
    }
  }
};

// ======================= ARTICLES API (Care Guide) =======================

export interface ArticleQuery {
  orchidId?: string;
  isPublished?: boolean;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  apiVersion?: string;
}

export type CreateArticlePayload = Omit<CareArticle, 'id'>;

const normalizeArticle = (
  article: Partial<CareArticle> & { id: string; title: string }
): CareArticle => ({
  id: article.id,
  title: article.title,
  slug: article.slug ?? '',
  summary: article.summary ?? '',
  content: article.content ?? '',
  thumbnailImageId: article.thumbnailImageId ?? null,
  thumbnailImageUrl: article.thumbnailImageUrl ?? '',
  isPublished: article.isPublished ?? false,
  orchidIds: article.orchidIds ?? [],
  documentIds: article.documentIds ?? [],
});

const throwArticleApiError = (body: unknown, fallback: string): never => {
  const errorBody = body !== null && typeof body === 'object'
    ? body as LoginResponse
    : {};
  throw new Error(getApiErrorMessage(errorBody, fallback));
};

export const getArticles = async (query: ArticleQuery = {}): Promise<CareArticle[]> => {
  const params = new URLSearchParams({
    PageNumber: String(query.pageNumber ?? 1),
    PageSize: String(query.pageSize ?? 100),
  });
  if (query.orchidId) params.set('OrchidId', query.orchidId);
  if (query.isPublished !== undefined) params.set('IsPublished', String(query.isPublished));
  if (query.searchTerm) params.set('SearchTerm', query.searchTerm);
  if (query.sortBy) params.set('SortBy', query.sortBy);
  if (query.sortDescending !== undefined) params.set('SortDescending', String(query.sortDescending));
  if (query.apiVersion) params.set('api-version', query.apiVersion);
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Articles?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwArticleApiError(body, 'Không thể tải danh sách bài viết.');
  const data = body as { items?: Array<Partial<CareArticle> & { id: string; title: string }> } | Array<Partial<CareArticle> & { id: string; title: string }>;
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(normalizeArticle);
};

export const getArticleById = async (id: string, apiVersion?: string): Promise<CareArticle> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/api/Articles/${encodeURIComponent(id)}${query ? `?${query}` : ''}`,
    { headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
  );
  const body = await readApiResponse(response);
  if (!response.ok) throwArticleApiError(body, 'Không thể tải thông tin bài viết.');
  return normalizeArticle(body as Partial<CareArticle> & { id: string; title: string });
};

export const createArticle = async (data: CreateArticlePayload, apiVersion?: string): Promise<unknown> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Articles${query ? `?${query}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwArticleApiError(body, 'Không thể tạo bài viết mới.');
  return body;
};

export const updateArticle = async (
  id: string,
  data: CreateArticlePayload,
  apiVersion?: string
): Promise<unknown> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Articles/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ...data, id })
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwArticleApiError(body, 'Không thể cập nhật bài viết.');
  return body;
};

export const deleteArticle = async (id: string, apiVersion?: string): Promise<void> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Articles/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwArticleApiError(body, 'Không thể xóa bài viết.');
};



// ======================= ORCHIDS API =======================

export interface OrchidQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  apiVersion?: string;
}

export type CreateOrchidPayload = Omit<Orchid, 'id'>;
export type UpdateOrchidPayload = Orchid & { id: string };

type RawOrchidImage = string | {
  id?: string;
  url?: string;
  imageUrl?: string;
  secureUrl?: string;
};

type RawOrchid = Partial<Orchid> & {
  id: string;
  name: string;
  categories?: Array<string | { id?: string }>;
  images?: RawOrchidImage[];
  uploadedImages?: RawOrchidImage[];
};

const IMAGE_URL_CACHE_KEY = 'orchid_uploaded_image_urls';

type CachedImage = { url: string; publicId?: string };

const readImageUrlCache = (): Record<string, CachedImage> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(IMAGE_URL_CACHE_KEY) || '{}') as Record<string, CachedImage>;
  } catch {
    return {};
  }
};

export const getUploadedImageUrl = (imageId: string | null | undefined): string => {
  if (!imageId) return '';
  return readImageUrlCache()[imageId]?.url ?? '';
};

const rememberUploadedImage = (image: UploadedImage) => {
  if (typeof window === 'undefined' || !/^https?:\/\//i.test(image.url)) return;
  try {
    const cache = readImageUrlCache();
    cache[image.id] = { url: image.url, publicId: image.publicId };
    window.localStorage.setItem(IMAGE_URL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The upload is still valid when browser storage is unavailable.
  }
};

const getRawOrchidImageUrls = (orchid: RawOrchid): string[] => {
  const cache = readImageUrlCache();
  const candidates: RawOrchidImage[] = [
    ...(orchid.imageUrls ?? []),
    ...(orchid.images ?? []),
    ...(orchid.uploadedImages ?? []),
    ...(orchid.uploadedImageIds ?? []),
    ...(orchid.uploadedImageIds ?? []).flatMap((id) => cache[id]?.url ? [cache[id].url] : []),
  ];
  const urls = candidates.flatMap((image) => {
    if (typeof image === 'string') return /^(https?:\/\/|data:)/i.test(image) ? [image] : [];
    const url = image.url ?? image.imageUrl ?? image.secureUrl;
    return typeof url === 'string' && url ? [url] : [];
  });
  return [...new Set(urls)];
};

const normalizeOrchid = (orchid: RawOrchid): Orchid => ({
  id: orchid.id,
  name: orchid.name,
  englishName: orchid.englishName ?? '',
  categoryIds: orchid.categoryIds?.length
    ? orchid.categoryIds
    : (orchid.categories ?? []).flatMap((category) => {
        if (typeof category === 'string') return [category];
        return typeof category.id === 'string' && category.id ? [category.id] : [];
      }),
  shortDescription: orchid.shortDescription ?? '',
  detailedDescription: orchid.detailedDescription ?? '',
  hasFragrance: orchid.hasFragrance ?? false,
  isPopular: orchid.isPopular ?? false,
  slug: orchid.slug ?? '',
  uploadedImageIds: orchid.uploadedImageIds ?? [],
  imageUrls: getRawOrchidImageUrls(orchid),
  displayOrder: orchid.displayOrder ?? 0,
});

const throwOrchidApiError = (body: unknown, fallback: string): never => {
  const errorBody = body !== null && typeof body === 'object'
    ? body as LoginResponse
    : {};
  throw new Error(getApiErrorMessage(errorBody, fallback));
};

export const getOrchids = async (query: OrchidQuery = {}): Promise<Orchid[]> => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams({
    PageNumber: String(query.pageNumber ?? 1),
    PageSize: String(query.pageSize ?? 100),
  });
  if (query.searchTerm) params.set('SearchTerm', query.searchTerm);
  if (query.sortBy) params.set('SortBy', query.sortBy);
  if (query.sortDescending !== undefined) params.set('SortDescending', String(query.sortDescending));
  if (query.apiVersion) params.set('api-version', query.apiVersion);
  const response = await fetch(`${API_BASE_URL}/api/Orchids?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error('Không thể tải danh sách hoa lan.');
  }
  const data = await response.json() as { items?: RawOrchid[] } | RawOrchid[];
  const items = Array.isArray(data) ? data : data.items ?? [];
  return items.map(normalizeOrchid);
};

export const getOrchidById = async (id: string, apiVersion?: string): Promise<Orchid> => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/api/Orchids/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwOrchidApiError(body, 'Không thể tải thông tin hoa lan.');
  return normalizeOrchid(body as RawOrchid);
};

export const createOrchid = async (data: CreateOrchidPayload, apiVersion?: string): Promise<unknown> => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  // displayOrder is assigned by the backend/database for new orchids.
  const { displayOrder: _displayOrder, imageUrls: _imageUrls, ...createData } = data;
  const response = await fetch(`${API_BASE_URL}/api/Orchids${query ? `?${query}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(createData)
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwOrchidApiError(body, `Không thể tạo hoa lan mới (HTTP ${response.status}).`);
  return body;
};

export const updateOrchid = async (
  id: string,
  data: Omit<UpdateOrchidPayload, 'id'>,
  apiVersion?: string
): Promise<unknown> => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const { imageUrls: _imageUrls, ...updateData } = data;
  const response = await fetch(`${API_BASE_URL}/api/Orchids/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ...updateData, id })
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwOrchidApiError(body, `Không thể cập nhật hoa lan (HTTP ${response.status}).`);
  return body;
};

export const deleteOrchid = async (id: string, apiVersion?: string): Promise<void> => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/api/Orchids/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const body = await readApiResponse(response);
  if (!response.ok) throwOrchidApiError(body, 'Không thể xóa hoa lan.');
};

// ======================= IMAGES API =======================

export interface UploadedImage {
  id: string;
  publicId: string;
  url: string;
  fileName?: string;
}

const getUploadResponseField = (record: Record<string, unknown>, names: string[]) => {
  const matchingKey = Object.keys(record).find((key) => names.includes(key.toLowerCase()));
  return matchingKey ? record[matchingKey] : undefined;
};

const findUploadedImageRecord = (value: unknown, depth = 0): Record<string, unknown> | null => {
  if (depth > 8 || value === null || typeof value !== 'object') return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findUploadedImageRecord(item, depth + 1);
      if (match) return match;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = getUploadResponseField(record, ['id', 'imageid', 'uploadedimageid', 'value']);
  if (typeof id === 'string' && id) return record;

  for (const nested of Object.values(record)) {
    const match = findUploadedImageRecord(nested, depth + 1);
    if (match) return match;
  }
  return null;
};

const normalizeUploadedImage = (body: unknown): UploadedImage => {
  if (typeof body === 'string' && body) {
    return { id: body, publicId: '', url: '' };
  }
  const envelope = body !== null && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null;
  if (envelope?.success === false) {
    const message = typeof envelope.message === 'string' ? envelope.message : '';
    const details = typeof envelope.details === 'string' ? envelope.details : '';
    const errorCode = typeof envelope.errorCode === 'string' ? envelope.errorCode : '';
    throw new Error(message || details || (errorCode
      ? `API upload ảnh thất bại (${errorCode}).`
      : 'API upload ảnh báo thất bại.'));
  }
  const data = findUploadedImageRecord(body);
  const id = data ? getUploadResponseField(data, ['id', 'imageid', 'uploadedimageid', 'value']) : undefined;
  const publicId = data ? getUploadResponseField(data, ['publicid', 'public_id']) : undefined;
  const url = data ? getUploadResponseField(data, ['secureurl', 'secure_url', 'url', 'imageurl', 'displayurl', 'path']) : undefined;

  if (typeof id !== 'string' || !id) {
    const nestedData = envelope?.data;
    const dataShape = nestedData === null
      ? 'null'
      : Array.isArray(nestedData)
        ? `mảng ${nestedData.length} phần tử`
        : typeof nestedData === 'object'
          ? `các trường ${Object.keys(nestedData as Record<string, unknown>).join(', ') || 'rỗng'}`
          : typeof nestedData;
    const backendMessage = typeof envelope?.message === 'string' && envelope.message
      ? ` Thông báo backend: ${envelope.message}`
      : '';
    throw new Error(`API upload ảnh không trả về ID ảnh. data: ${dataShape}.${backendMessage}`);
  }

  return {
    id,
    publicId: typeof publicId === 'string' ? publicId : '',
    url: typeof url === 'string' ? url : '',
    fileName: data && typeof getUploadResponseField(data, ['filename', 'originalname']) === 'string'
      ? getUploadResponseField(data, ['filename', 'originalname']) as string
      : undefined,
  };
};

export const uploadImage = async (file: File): Promise<UploadedImage> => {
  const token = getStoredAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  const previewUrl = URL.createObjectURL(file);
  try {
    const response = await fetch(`${API_BASE_URL}/api/Images/upload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData,
    });
    const body = await readApiResponse(response);
    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất rồi đăng nhập lại trước khi tải ảnh.');
    }
    if (response.status >= 500) {
      throw new Error(`API lưu trữ ảnh đang lỗi (HTTP ${response.status}). Vui lòng kiểm tra cấu hình Cloudinary trên máy chủ Render.`);
    }
    if (!response.ok) throwOrchidApiError(body, `Không thể tải ảnh lên (HTTP ${response.status}).`);
    const normalized = normalizeUploadedImage(body);
    const uploaded = {
      ...normalized,
      url: normalized.url || previewUrl,
      fileName: file.name,
    };
    rememberUploadedImage(uploaded);
    return uploaded;
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
};

export const deleteUploadedImage = async (publicId: string): Promise<void> => {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/Images/${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  const body = await readApiResponse(response);
  if (response.status === 401) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi xóa ảnh.');
  }
  if (!response.ok) throwOrchidApiError(body, 'Không thể xóa ảnh.');
  if (typeof window !== 'undefined') {
    try {
      const cache = readImageUrlCache();
      Object.keys(cache).forEach((id) => {
        if (cache[id]?.publicId === publicId) delete cache[id];
      });
      window.localStorage.setItem(IMAGE_URL_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore browser storage cleanup failures after a successful API delete.
    }
  }
};

export interface DiscussionCommentDto {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface DiscussionPostDto {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
  comments: DiscussionCommentDto[];
}

export interface PaginatedDiscussions {
  items: DiscussionPostDto[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const discussionHeaders = (withJsonBody = false): HeadersInit => {
  const token = getStoredAuthToken();
  return {
    Accept: 'application/json',
    ...(withJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const unwrapDiscussionResponse = (body: unknown): unknown => {
  if (body !== null && typeof body === 'object' && 'data' in body) {
    return (body as { data?: unknown }).data;
  }
  return body;
};

const throwDiscussionApiError = (status: number, body: unknown, fallback: string): never => {
  if (status === 401) {
    throw new Error('Bạn cần đăng nhập lại để thực hiện thao tác này.');
  }
  const errorBody = body !== null && typeof body === 'object' ? body as LoginResponse : {};
  throw new Error(getApiErrorMessage(errorBody, fallback));
};

export const getDiscussions = async (query: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  apiVersion?: string;
} = {}): Promise<PaginatedDiscussions> => {
  const params = new URLSearchParams({
    PageNumber: String(query.pageNumber ?? 1),
    PageSize: String(query.pageSize ?? 20),
  });
  if (query.searchTerm) params.set('SearchTerm', query.searchTerm);
  if (query.apiVersion) params.set('api-version', query.apiVersion);

  const response = await fetch(`${API_BASE_URL}/api/Discussions?${params.toString()}`, {
    headers: discussionHeaders(),
  });
  const body = await readApiResponse(response);
  if (!response.ok) {
    throwDiscussionApiError(response.status, body, 'Không thể tải danh sách thảo luận.');
  }
  return unwrapDiscussionResponse(body) as PaginatedDiscussions;
};

export const getDiscussionById = async (id: string, apiVersion?: string): Promise<DiscussionPostDto> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const suffix = params.size ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/Discussions/${encodeURIComponent(id)}${suffix}`, {
    headers: discussionHeaders(),
  });
  const body = await readApiResponse(response);
  if (!response.ok) {
    throwDiscussionApiError(response.status, body, 'Không thể tải nội dung thảo luận.');
  }
  return unwrapDiscussionResponse(body) as DiscussionPostDto;
};

export const createDiscussion = async (
  payload: { title: string; content: string },
  apiVersion?: string,
): Promise<string> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const suffix = params.size ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/Discussions${suffix}`, {
    method: 'POST',
    headers: discussionHeaders(true),
    body: JSON.stringify(payload),
  });
  const body = await readApiResponse(response);
  if (!response.ok) {
    throwDiscussionApiError(response.status, body, 'Không thể đăng bài thảo luận.');
  }
  const result = unwrapDiscussionResponse(body);
  if (typeof result === 'string') return result.replace(/^"|"$/g, '');
  if (result !== null && typeof result === 'object' && typeof (result as { id?: unknown }).id === 'string') {
    return (result as { id: string }).id;
  }
  throw new Error('API đã tạo bài nhưng không trả về ID bài thảo luận.');
};

export const createDiscussionComment = async (
  discussionId: string,
  content: string,
  apiVersion?: string,
): Promise<string> => {
  const params = new URLSearchParams();
  if (apiVersion) params.set('api-version', apiVersion);
  const suffix = params.size ? `?${params.toString()}` : '';
  const response = await fetch(
    `${API_BASE_URL}/api/Discussions/${encodeURIComponent(discussionId)}/comments${suffix}`,
    {
      method: 'POST',
      headers: discussionHeaders(true),
      body: JSON.stringify({ content }),
    },
  );
  const body = await readApiResponse(response);
  if (!response.ok) {
    throwDiscussionApiError(response.status, body, 'Không thể gửi bình luận.');
  }
  const result = unwrapDiscussionResponse(body);
  if (typeof result === 'string') return result.replace(/^"|"$/g, '');
  if (result !== null && typeof result === 'object' && typeof (result as { id?: unknown }).id === 'string') {
    return (result as { id: string }).id;
  }
  return '';
};
