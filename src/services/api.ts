import { supabase } from './supabaseClient';

const BACKEND_URL = 'https://capstone-production-7587.up.railway.app';
const LLM_URL = 'https://motivated-vibrancy-production-4664.up.railway.app';

async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function request<T = any>(
  baseUrl: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Events
  getEvents: () => request(BACKEND_URL, '/api/events?limit=2000'),
  getEvent: (id: string) => request(BACKEND_URL, `/api/events/${id}`),
  searchEvents: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request(BACKEND_URL, `/api/events/search?${qs}`);
  },

  // User
  getMe: () => request(BACKEND_URL, '/api/users/me'),
  getMyProfile: () => request(BACKEND_URL, '/api/users/me/profile'),
  getMyPreferences: () => request(BACKEND_URL, '/api/users/me/preferences'),
  updatePreferences: (prefs: any) =>
    request(BACKEND_URL, '/api/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),
  addInteraction: (interaction: any) =>
    request(BACKEND_URL, '/api/users/me/interactions', {
      method: 'POST',
      body: JSON.stringify(interaction),
    }),

  // Chat (Tully)
  chatWithTully: (
    message: string,
    userId: string | null = null,
    conversationHistory: any[] = [],
    conversationId: string | null = null,
  ) =>
    request(LLM_URL, '/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        user_id: userId,
        conversation_history: conversationHistory,
        conversation_id: conversationId,
      }),
    }),
};