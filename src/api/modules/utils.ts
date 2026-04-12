import { apiRequest } from "../client";

export function toQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;

    if (Array.isArray(data.items)) {
      return data.items as T[];
    }

    if (Array.isArray(data.data)) {
      return data.data as T[];
    }

    if (Array.isArray(data.results)) {
      return data.results as T[];
    }
  }

  return [];
}

export async function getList<T>(path: string): Promise<T[]> {
  const payload = await apiRequest<unknown>(path, { method: "GET" });
  return normalizeList<T>(payload);
}
