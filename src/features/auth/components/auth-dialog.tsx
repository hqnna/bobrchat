"use client";

import { MessageCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
// import { LoginForm } from "~/features/auth/components/login-form";

import { GitHubAuth } from "./github-auth";

type AuthDialogProps = {
  open?: boolean;
  showCloseButton?: boolean;
};

export function AuthDialog({ open = true, showCloseButton = false }: AuthDialogProps) {
  const [isLogin, _setIsLogin] = useState(false);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm p-4" showCloseButton={showCloseButton}>
        <DialogTitle className="sr-only">BobrChat Auth</DialogTitle>
        <div className="space-y-4">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <MessageCircleIcon className="text-primary size-5" />
              <span className="text-sm font-semibold">BobrChat</span>
            </div>
            <h1 className="text-lg font-semibold">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground px-8 pt-2 text-sm">
              {isLogin
                ? "Sign in to continue to BobrChat"
                : "Stop paying for subscriptions you don't finish. Most platforms charge a flat fee for limits you never hit. BobrChat changes that."}
            </p>
          </div>
          {/* <LoginForm isLogin={isLogin} /> */}
          {/* <AuthOptionsSeparator /> */}
          <GitHubAuth />
          {/* <p className="text-muted-foreground text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <AuthToggleButton
              isLogin={isLogin}
              onClickAction={() => setIsLogin(!isLogin)}
            />
          </p> */}
          <p className="text-muted-foreground text-center text-xs">
            This app is an experiment. We don't bill you for AI usage. We may introduce billing for storage in the future. You bring your own API key and pay providers directly for the tokens you actually use.
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}

export function AuthOptionsSeparator() {
  return (
    <div className="relative">
      <Separator />
      <span
        className={`
          bg-background text-muted-foreground absolute top-1/2 left-1/2
          -translate-x-1/2 -translate-y-1/2 px-2 text-xs
        `}
      >
        or
      </span>
    </div>
  );
}

export function AuthToggleButton({
  isLogin,
  onClickAction,
}: {
  isLogin: boolean;
  onClickAction: () => void;
}) {
  return (
    <Button
      variant="link"
      size="sm"
      onClick={onClickAction}
      className="px-0"
    >
      {isLogin ? "Sign up" : "Sign in"}
    </Button>
  );
}
