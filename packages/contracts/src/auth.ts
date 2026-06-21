import { z } from "zod";

export const registerInput = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    password: z.string().min(8).max(128),
    displayName: z.string().min(1).max(40),
  })
  .refine((v) => v.email || v.phone, {
    message: "email 或 phone 至少提供一个",
    path: ["email"],
  });
export type RegisterInput = z.infer<typeof registerInput>;

export const loginInput = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInput>;

export const USER_ROLES = [
  "GUEST",
  "FREE_USER",
  "PRO_USER",
  "CREATOR",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface PublicUser {
  id: string;
  displayName: string;
  email?: string | null;
  role: UserRole;
  avatarKey?: string | null;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
}
