type ApiMethod = "GET" | "POST";

interface ApiRequestOptions {
  method?: ApiMethod;
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

interface ApiResponse<T> {
  data: T;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(path: string, options?: Omit<ApiRequestOptions, "method">) {
    return this.request<T>(path, { ...options, method: "POST" });
  }

  private async request<T>(path: string, options: ApiRequestOptions): Promise<ApiResponse<T>> {
    const method = options.method || "GET";
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const payload = await response.json().catch(() => ({ error: "Invalid response payload" }));
    if (!response.ok) {
      const errorMessage = payload?.error || "Request failed";
      throw new Error(errorMessage);
    }

    return { data: payload as T };
  }
}

export const apiClient = new ApiClient("/api");
