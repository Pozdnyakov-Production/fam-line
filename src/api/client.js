import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export const setupInterceptors = (store, logoutAction) => {
  client.interceptors.request.use(config => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        store.dispatch(logoutAction());
      }
      return Promise.reject(error);
    }
  );
};

export default client;