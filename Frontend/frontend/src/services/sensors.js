import { get } from './api';

export const list    = ()                   => get('/api/sensors/');
export const latest  = (sensorId)           => get(`/api/sensors/${sensorId}/latest/`);
export const readings = (sensorId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/sensors/${sensorId}/readings/${qs ? '?' + qs : ''}`);
};
