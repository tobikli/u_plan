"use server";

import { createClient } from "@/lib/supabase/server";

export async function signUpNewUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${
        process.env.BASE_URL || "http://localhost:3000"
      }`,
      data: { name },
    },
  });
  return { data, error };
}

export async function signInUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOutUser() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.BASE_URL || "http://localhost:3000"
    }`,
  });
  console.log("Reset password data:", data);
  return { data, error };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}