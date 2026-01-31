/**
 * Client-side validation for auth forms.
 * No Zod dependency to avoid bundling 700KB+ of locales.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

export type ValidationResult<T>
  = | { success: true; data: T }
    | { success: false; error: { issues: Array<{ path: string[]; message: string }> } };

export type SignInData = { email: string; password: string };
export type SignUpData = { name: string; email: string; password: string };

export function validateSignIn(data: { email: string; password: string }): ValidationResult<SignInData> {
  const issues: Array<{ path: string[]; message: string }> = [];

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    issues.push({ path: ["email"], message: "Invalid email address" });
  }

  if (!data.password || data.password.length < 6) {
    issues.push({ path: ["password"], message: "Password must be at least 6 characters" });
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }

  return { success: true, data: { email: data.email, password: data.password } };
}

export function validateSignUp(data: { name: string; email: string; password: string }): ValidationResult<SignUpData> {
  const issues: Array<{ path: string[]; message: string }> = [];

  if (!data.name || data.name.length < 2) {
    issues.push({ path: ["name"], message: "Name must be at least 2 characters" });
  }

  if (!data.email || !EMAIL_REGEX.test(data.email)) {
    issues.push({ path: ["email"], message: "Invalid email address" });
  }

  if (!data.password || data.password.length < 6) {
    issues.push({ path: ["password"], message: "Password must be at least 6 characters" });
  }

  if (issues.length > 0) {
    return { success: false, error: { issues } };
  }

  return { success: true, data: { name: data.name, email: data.email, password: data.password } };
}
