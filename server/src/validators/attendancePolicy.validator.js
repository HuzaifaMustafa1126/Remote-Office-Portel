import { z } from 'zod';
const integer = z.number().int().min(0).max(100000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(`${v}T00:00:00Z`); return !isNaN(d) && d.toISOString().slice(0,10) === v; }, 'Invalid date');
export const policySchema = z.object({
 name: z.string().trim().min(1).max(150),
 late_rule_enabled: z.boolean(), grace_minutes: integer,
 late_accumulation_enabled: z.boolean(), late_instances_required: integer.min(1),
 late_penalty_type: z.enum(['FULL_DAY_LEAVE','HALF_DAY','SALARY_DEDUCTION','NO_PENALTY']),
 late_penalty_quantity: z.number().min(0).max(10000).multipleOf(0.01),
 half_day_rule_enabled: z.boolean(), half_day_after_minutes: integer.min(1),
 half_day_salary_deduction_percent: z.number().min(0).max(100).multipleOf(0.01),
 count_half_day_as_late: z.boolean(),
 late_counter_period: z.enum(['MONTHLY','PAYROLL_CYCLE','CALENDAR_MONTH','NEVER']),
 effective_from: date,
}).strict().refine(p => !p.half_day_rule_enabled || p.half_day_after_minutes > p.grace_minutes,
 { message: 'Half-day threshold must exceed the grace period', path: ['half_day_after_minutes'] });
export const waiveSchema = z.object({ reason: z.string().trim().min(5).max(500) }).strict();
