import {z} from "zod";
export const nameSchema=z.object({name:z.string().trim().min(1).max(100)}).strict();
export const settingsSchema=z.object({defaultSoundId:z.number().int().positive(),normalVolume:z.number().int().min(0).max(100),importantVolume:z.number().int().min(0).max(100),warningVolume:z.number().int().min(0).max(100),criticalVolume:z.number().int().min(0).max(100),assignments:z.array(z.object({scopeType:z.enum(["CATEGORY","EVENT"]),scopeKey:z.string().trim().min(1).max(50),soundId:z.number().int().positive()}).strict()).max(150)}).strict();
