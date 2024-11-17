import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const axiosWithRetry = axios.create();

axiosWithRetry.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    if (!config || !config.retry) {
      config.retry = 0;
    }

    if (config.retry >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.retry += 1;
    
    const delayRetryRequest = new Promise(resolve => {
      setTimeout(() => {
        console.log('Retrying request', config.url);
        resolve(null);
      }, RETRY_DELAY);
    });

    await delayRetryRequest;
    return axiosWithRetry(config);
  }
); 