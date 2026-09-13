"use server";

import { z } from "zod";
import { AuthError } from "next-auth";

import { createUser, getUser } from "@/db/queries";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  let validatedData: z.infer<typeof authFormSchema>;

  try {
    validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }

  try {
    await signIn("credentials", {
      email: validatedData.email.trim().toLowerCase(),
      password: validatedData.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "failed" };
    }

    throw error;
  }

  return { status: "success" };
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  let validatedData: z.infer<typeof authFormSchema>;

  try {
    validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }

  const email = validatedData.email.trim().toLowerCase();
  const [user] = await getUser(email);

  if (user) {
    return { status: "user_exists" };
  }

  await createUser(email, validatedData.password);

  try {
    await signIn("credentials", {
      email,
      password: validatedData.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "failed" };
    }

    throw error;
  }

  return { status: "success" };
};
