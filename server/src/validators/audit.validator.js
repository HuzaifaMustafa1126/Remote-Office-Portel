import {z} from 'zod';
const optionalDate=z.preprocess(v=>v===''?undefined:v,z.string().date().optional());
const optionalCategory=z.preprocess(v=>v===''?undefined:v,z.enum(['authentication','attendance','breaks','employees','roles','permissions']).optional());
export const auditQuerySchema=z.object({search:z.string().trim().max(100).optional(),category:optionalCategory,userId:z.preprocess(v=>v===''?undefined:v,z.coerce.number().int().positive().optional()),from:optionalDate,to:optionalDate,page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(50).default(20)});
