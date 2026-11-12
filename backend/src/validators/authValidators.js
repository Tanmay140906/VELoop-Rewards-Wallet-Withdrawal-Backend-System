import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('A valid email address is required.')
  .max(254, 'Email is too long.');

// bcrypt only uses the first 72 bytes, so we cap the length there
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.');

// z.object() strips unknown keys, so a client sending { "role": "admin" }
// to /register has that field silently dropped (no mass-assignment).
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80, 'Name is too long.'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(72, 'Password is too long.'),
});
