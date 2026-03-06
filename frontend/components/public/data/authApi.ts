/**
 * Stub – auth API helpers.
 * These will be implemented when the auth/booking flow is wired up.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function login(_body: { email: string; password: string }): Promise<any> {
  throw new Error("login: not implemented yet");
}

export async function signup(_body: {
  email: string;
  password: string;
  full_name: string;
  user_type: string;
}): Promise<any> {
  throw new Error("signup: not implemented yet");
}

export async function selectRole(_body: { role: string }, _token: string): Promise<any> {
  throw new Error("selectRole: not implemented yet");
}

export async function updateOnboarding(_data: Record<string, unknown>, _token?: string): Promise<void> {
  throw new Error("updateOnboarding: not implemented yet");
}
