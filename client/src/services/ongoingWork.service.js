import api from"./api";
export const getMine=()=>api.get("/ongoing-work/me").then(r=>r.data.data);
export const create=data=>api.post("/ongoing-work",data).then(r=>r.data.data);
export const update=(id,data)=>api.put(`/ongoing-work/${id}`,data).then(r=>r.data.data);
export const setStatus=(id,status)=>api.patch(`/ongoing-work/${id}/status`,{status}).then(r=>r.data.data);
export const remove=id=>api.delete(`/ongoing-work/${id}`).then(r=>r.data.data);
