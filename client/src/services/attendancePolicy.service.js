import api from './api';
export const listPolicies=()=>api.get('/attendance-policies').then(r=>r.data.data);
export const savePolicy=data=>api.post('/attendance-policies',data).then(r=>r.data.data);
