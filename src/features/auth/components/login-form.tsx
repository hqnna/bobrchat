"use client";

import {
  LoaderIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ValidationError } from "~/features/auth/types";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/features/auth/lib/auth-client";
import { signInSchema, signUpSchema } from "~/features/auth/types";

export function LoginForm({
  isLogin,
}: {
  isLogin: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find(e => e.field === field)?.message;
  };

  const handleAuthError = (error: { message?: string; status?: number; statusText?: string }) => {
    const errorMessage = error.message || error.statusText || "Authentication failed";
    const lowerErrorMessage = errorMessage.toLowerCase();

    let userMessage = errorMessage;
    if (lowerErrorMessage.includes("user not found")) {
      userMessage = "No account found. Please sign up.";
    }
    else if (lowerErrorMessage.includes("invalid")) {
      userMessage = "Invalid email or password.";
    }
    else if (lowerErrorMessage.includes("already exists")) {
      userMessage = "An account with this email already exists.";
    }

    toast.error(userMessage);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setLoading(true);

    try {
      if (isLogin) {
        const result = signInSchema.safeParse({ email, password });
        if (!result.success) {
          const errors = result.error.issues.map(issue => ({
            field: issue.path[0] as string,
            message: issue.message,
          }));
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        const { data, error: authError } = await authClient.signIn.email({
          email,
          password,
        });

        if (authError) {
          handleAuthError(authError);
          setLoading(false);
          return;
        }

        if (data) {
          // Force a hard navigation to ensure all client-side state is reset
          window.location.href = "/";
        }
      }
      else {
        const result = signUpSchema.safeParse({ name, email, password });
        if (!result.success) {
          const errors = result.error.issues.map(issue => ({
            field: issue.path[0] as string,
            message: issue.message,
          }));
          setValidationErrors(errors);
          setLoading(false);
          return;
        }

        const { data, error: authError } = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (authError) {
          handleAuthError(authError);
          setLoading(false);
          return;
        }

        if (data) {
          // Force a hard navigation to ensure all client-side state is reset
          window.location.href = "/";
        }
      }
    }
    catch (err) {
      console.error("Auth error:", err);
      toast.error("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailAuth} className="space-y-3">
      {!isLogin && (
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
            aria-invalid={!!getFieldError("name")}
            className={getFieldError("name")
              ? `border-destructive`
              : ""}
          />
          {getFieldError("name") && (
            <p className="text-destructive text-xs">{getFieldError("name")}</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          aria-invalid={!!getFieldError("email")}
          className={getFieldError("email")
            ? `border-destructive`
            : ""}
        />
        {getFieldError("email") && (
          <p className="text-destructive text-xs">{getFieldError("email")}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          aria-invalid={!!getFieldError("password")}
          className={getFieldError("password")
            ? `border-destructive`
            : ""}
        />
        {getFieldError("password") && (
          <p className="text-destructive text-xs">{getFieldError("password")}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? (
              <>
                <LoaderIcon className="size-4 animate-spin" />
                Loading...
              </>
            )
          : isLogin
            ? "Sign In"
            : "Create Account"}
      </Button>
    </form>
  );
}
