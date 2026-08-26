import {z} from 'zod';export const roleSchema=z.object({name:z.string().trim().min(2).max(80)});export const permissionsSchema=z.object({permissionIds:z.array(z.number().int().positive())});
