"use client";

import { CheckIcon, MonitorIcon, MoonIcon, SaveIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useRef, useState } from "react";

import { cn } from "~/lib/utils";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { useUserSettingsContext } from "./user-settings-provider";

type Theme = "light" | "dark" | "system";

const themeOptions: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function PreferencesTab() {
  const { settings, loading, updateSetting } = useUserSettingsContext();
  const initializedRef = useRef(false);

  const { setTheme: applyTheme } = useTheme();

  // Initialize state with settings data or defaults
  const [theme, setTheme] = useState<Theme>(() => settings?.theme ?? "system");
  const [customInstructions, setCustomInstructions] = useState(
    () => settings?.customInstructions ?? "",
  );
  const [defaultThreadName, setDefaultThreadName] = useState(
    () => settings?.defaultThreadName ?? "New Chat",
  );
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when settings load for the first time
  if (settings && !initializedRef.current) {
    initializedRef.current = true;
    if (theme !== settings.theme) {
      setTheme(settings.theme);
    }

    if (customInstructions !== (settings.customInstructions ?? "")) {
      setCustomInstructions(settings.customInstructions ?? "");
    }

    if (defaultThreadName !== settings.defaultThreadName) {
      setDefaultThreadName(settings.defaultThreadName);
    }
  }

  const hasChanges = settings
    && (theme !== settings.theme
      || customInstructions !== (settings.customInstructions || "")
      || defaultThreadName !== settings.defaultThreadName);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSetting({
        theme,
        customInstructions: customInstructions || undefined,
        defaultThreadName,
      });
      applyTheme(theme);
    }
    finally {
      setIsSaving(false);
    }
  }, [theme, customInstructions, defaultThreadName, updateSetting, applyTheme]);

  if (loading) {
    return <PreferencesTabSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <h3 className="text-lg font-semibold">Preferences</h3>
        <p className="text-muted-foreground text-sm">
          Customize your chat experience and appearance.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      `
                        flex flex-col items-center gap-2 rounded-lg border p-3
                        transition-colors
                      `,
                      isSelected
                        ? "border-primary bg-primary/5"
                        : `
                          border-input
                          hover:bg-muted
                        `,
                    )}
                  >
                    <div className="relative">
                      <Icon className="size-5" />
                      {isSelected && (
                        <CheckIcon
                          className={cn(`
                            bg-primary text-primary-foreground absolute -right-1
                            -bottom-1 size-3 rounded-full p-0.5
                          `)}
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Thread Name */}
          <div className="space-y-2">
            <Label htmlFor="defaultThreadName">Default Thread Name</Label>
            <Input
              id="defaultThreadName"
              type="text"
              value={defaultThreadName}
              onChange={e => setDefaultThreadName(e.target.value)}
              placeholder="New Chat"
            />
            <p className="text-muted-foreground text-xs">
              The default name for new chat threads.
            </p>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="customInstructions">Custom Instructions</Label>
            <Textarea
              id="customInstructions"
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="Add any custom instructions for the AI assistant..."
              className="min-h-30 resize-none"
            />
            <p className="text-muted-foreground text-xs">
              These instructions will be included in every conversation.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <SaveIcon className="size-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreferencesTabSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-3 w-72" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-30 w-full" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>
    </div>
  );
}
