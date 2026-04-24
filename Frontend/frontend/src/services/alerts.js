import { get, post } from './api';

export const list = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/alerts/${qs ? '?' + qs : ''}`);
};

export const acknowledge = (alertId) =>
  post(`/api/alerts/${alertId}/acknowledge/`);
