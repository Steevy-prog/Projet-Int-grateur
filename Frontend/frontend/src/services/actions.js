import { get } from './api';

export const list = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/actuators/actions/${qs ? '?' + qs : ''}`);
};
