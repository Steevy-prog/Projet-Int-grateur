import { get, post, patch } from './api';

export const list   = ()              => get('/api/users/');
export const create = (data)          => post('/api/users/', data);
export const update = (userId, data)  => patch(`/api/users/${userId}/`, data);
