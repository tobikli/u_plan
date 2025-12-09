"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Server action to sign up a new user.
 * 
 * @param formData - Form data containing email, password, and name
 * @returns The created user data or error
 */
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
        process.env.SITE_URL || "http://localhost:3000"
      }`,
      data: { name },
    },
  });
  return { data, error };
}

/**
 * Server action to sign in an existing user.
 * 
 * @param formData - Form data containing email and password
 * @returns The signed in user data or error
 */
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

/**
 * Server action to sign out the current user.
 * 
 * @returns Error if sign out failed, or success
 */
export async function signOutUser() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Server action to reset a user's password.
 * Sends a password reset email to the specified address.
 * 
 * @param formData - Form data containing the user's email
 * @returns Success data or error
 */
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      process.env.SITE_URL || "http://localhost:3000"
    }`,
  });
  console.log("Reset password data:", data);
  return { data, error };
}

/**
 * Server action to get the currently authenticated user.
 * 
 * @returns The current user or error
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}