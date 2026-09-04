export const getAuthToken = () => {
  try {
    return (
      localStorage.getItem("ZEROFIT_token") ||
      sessionStorage.getItem("ZEROFIT_token") ||
      localStorage.getItem("zerofit_token") ||
      sessionStorage.getItem("zerofit_token") ||
      ""
    );
  } catch {
    return "";
  }
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  return fetch(url, {
    ...options,
    headers
  });
};
