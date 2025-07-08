import z from "zod/v4";

export const UserSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  email: z.email().trim(),
  password: z.string().trim(),
  token: z.string().optional(),
  updatedAt: z.date().optional(),
});
export type User = z.infer<typeof UserSchema>;

const StaffSchema = z.object({
  id: z.uuid(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  email: z.email().trim().optional(),
  phone: z.number().positive().optional(),
  department: z.enum(["司厨部", "甲板部", "機関部"]),
  role: z.string().trim(),
  salary: z.number().positive(),
  code: z.string(),
  status: z.boolean().default(false),
  isActive: z.boolean().default(true),
  shipId: z.string().optional(),
  updatedAt: z.iso.date().optional(),
});
export type Staff = z.infer<typeof StaffSchema>;

const ShipSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  updatedAt: z.iso.date().optional(),
});
export type Ship = z.infer<typeof ShipSchema>;

const ScheduleSchema = z.object({
  id: z.uuid(),
  embark: z.date().optional(),
  desembark: z.date().optional(),
  shipId: z.string(),
  staffId: z.string(),
  updatedAt: z.iso.date().optional(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;
