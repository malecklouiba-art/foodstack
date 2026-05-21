import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export function createServerClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerComponentClient({ cookies: cookies as any });
}

export function createRouteClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createRouteHandlerClient({ cookies: cookies as any });
}

export async function getSession() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
