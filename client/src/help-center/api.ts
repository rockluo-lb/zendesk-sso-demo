type ApiResult<T> = { ok: boolean; status: number; data: T };

async function api<T = unknown>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(path, options).catch(() => null);
  if (!res) return { ok: false, status: 0, data: { error: 'Network error' } as T };
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data: data as T };
}

function jsonBody(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export { api, jsonBody };
export type { ApiResult };
