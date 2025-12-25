export type ApiResponse<T> = {
    ok: boolean;
    data: T;
    message?: string;
  };
  
  export class ApiError extends Error {
    constructor(public status: number, public bodyText: string) {
      super(`API ${status}: ${bodyText}`);
    }
  }
  
  export async function apiData<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
  
    const text = await res.text().catch(() => "");
    if (!res.ok) throw new ApiError(res.status, text);
    if (!text) return null as T;

    const json = JSON.parse(text) as ApiResponse<T>;
    return json.data;
  }
  