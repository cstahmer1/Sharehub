import { QueryClient, QueryFunction } from "@tanstack/react-query";

class ValidationError extends Error {
  errors?: Array<{ message: string; path: string[] }>;
  
  constructor(message: string, errors?: Array<{ message: string; path: string[] }>) {
    super(message);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const json = JSON.parse(text);
      const message = json.message || text;
      // If there are validation errors, include them in the error
      if (json.errors && Array.isArray(json.errors)) {
        throw new ValidationError(message, json.errors);
      }
      throw new Error(message);
    } catch (e) {
      // If parsing failed, throw the raw text
      if (e instanceof SyntaxError) {
        throw new Error(text);
      }
      // Otherwise rethrow the error we created
      throw e;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
