import { get, patch } from './api';

export const list   = ()                        => get('/api/thresholds/');
export const update = (sensor_type, data)       => patch(`/api/thresholds/${sensor_type}/`, data);
