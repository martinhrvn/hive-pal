export const getEnvVariable = (key: string): string => {
  if (
    window.ENV &&
    window.ENV[key] !== undefined &&
    !window.ENV[key].startsWith("$")
  ) {
    console.log("Getting env variable from window", key, window.ENV[key]);
    return window.ENV[key];
  }

  const variable = import.meta.env[key] || "";
  console.log("Getting env variable from meta", key, variable);
  return variable;
};

export const getApiUrl = (url: string) => {
  return `${getEnvVariable("VITE_API_URL") ?? "http://localhost:3000"}${url}`;
};
export const createApiClient = (getToken: () => string | null) => {
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${getApiUrl(endpoint)}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // You might want to trigger a logout here
        throw new Error("Authentication expired");
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    get: <T>(endpoint: string) => fetchWithAuth(endpoint) as Promise<T>,

    post: <T>(endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<T>,

    put: <T>(endpoint: string, data: unknown) =>
      fetchWithAuth(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      }) as Promise<T>,

    delete: <T>(endpoint: string) =>
      fetchWithAuth(endpoint, {
        method: "DELETE",
      }) as Promise<T>,
  };
};
