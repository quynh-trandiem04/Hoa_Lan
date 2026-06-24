// src/services/api.ts

// Mặc định gọi đến localhost:7111. Bạn có thể sửa URL này thành cổng của backend thực tế.
export const API_BASE_URL = 'https://localhost:7111';

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
  const response = await fetch(`${API_BASE_URL}/api/Orchids`);
  if (!response.ok) {
    throw new Error('Failed to fetch orchids');
  }
  return response.json();
};

export const getOrchidById = async (id: string | number) => {
  const response = await fetch(`${API_BASE_URL}/api/Orchids/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch orchid');
  }
  return response.json();
};

export const createOrchid = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/Orchids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to create orchid');
  }
  return response.json();
};

export const updateOrchid = async (id: string | number, data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/Orchids/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
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
  const response = await fetch(`${API_BASE_URL}/api/Orchids/${id}`, {
    method: 'DELETE'
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
