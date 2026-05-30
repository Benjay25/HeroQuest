'use server';

/**
 * Auth Server Actions
 *
 * 'use server' at the top marks these as Server Actions — functions that
 * run exclusively on the server but can be called directly from Client
 * Components as if they were regular async functions.
 *
 * This is one of the most important App Router concepts:
 *
 *   Client Component (browser) → calls signIn() →
 *   Next.js sends a POST request to the server →
 *   signIn() runs on the server, talks to Supabase →
 *   Returns a result back to the client
 *
 * The benefit: our Supabase calls stay on the server, form handling
 * is done without building a separate API route, and TypeScript types
 * flow through the whole chain.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  // FormData is the native web API for form submissions.
  // .get() retrieves a field by its name attribute.
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // We encode the error in the URL so the login page can display it.
    // In a later phase we'll replace this with a more elegant toast system.
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  /**
   * revalidatePath('/') clears Next.js's server-side cache for that route.
   * After login, cached pages that showed guest content need to be re-rendered
   * to show the logged-in state. Without this, a cached page might still
   * show "Sign In" in the nav even after logging in.
   */
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // data stored in the user's auth metadata — available immediately
      // without needing a separate database query
      data: { display_name: displayName },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  // After signup, send to dashboard — Supabase may require email confirmation
  // depending on your project settings; we'll handle that edge case later.
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
