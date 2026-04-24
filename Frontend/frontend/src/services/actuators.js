import { get, post } from './api';

export const list    = ()                                    => get('/api/actuators/');
export const trigger = (actuatorId, action_type, notes = '') =>
  post(`/api/actuators/${actuatorId}/action/`, { action_type, notes });
