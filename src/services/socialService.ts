const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/social';

function getToken(): string | null {
  return localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  });
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Erreur réseau (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export interface SocialProfile {
  id: string;
  platform: string;
  label: string;
  avatar?: string;
  profileName?: string;
  profileId?: string;
  connected: boolean;
  status: string;
}

export interface CreatePostPayload {
  profileIds: string[];
  text: string;
  mediaUrls?: string[];
  scheduledAt?: string;
  postType?: string;
  platform?: string;
}

export interface BufferUpdateResult {
  success: boolean;
  data: any;
}

export const socialService = {
  async getProfiles(): Promise<SocialProfile[]> {
    const res = await request<{ success: boolean; data: SocialProfile[] }>(`${API_BASE}/profiles`);
    return res.data;
  },

  async createPost(payload: CreatePostPayload): Promise<BufferUpdateResult> {
    return request<BufferUpdateResult>(`${API_BASE}/posts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPostStatus(updateId: string): Promise<BufferUpdateResult> {
    return request<BufferUpdateResult>(`${API_BASE}/posts/${updateId}`);
  },

  async getProfileUpdates(profileId: string, params?: { limit?: number; status?: string }): Promise<BufferUpdateResult> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return request<BufferUpdateResult>(`${API_BASE}/profiles/${profileId}/updates${query ? `?${query}` : ''}`);
  },

  async uploadMedia(file: File): Promise<BufferUpdateResult> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};
