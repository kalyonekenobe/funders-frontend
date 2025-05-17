import axios, { HttpStatusCode } from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

instance.interceptors.request.use(
  async config => {
    return config;
  },
  async error => Promise.reject(error),
);

instance.interceptors.response.use(
  async response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;
    if (error.response.status === HttpStatusCode.Unauthorized && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {},
          },
        );

        error.config.headers = {
          ...error.config.headers,
        };

        return instance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
