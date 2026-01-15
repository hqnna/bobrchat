"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { PreferencesUpdate } from "~/features/settings/types";

import { Kbd } from "~/components/ui/kbd";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { useUpdatePreferences, useUserSettings } from "~/features/settings/hooks/use-user-settings";

import { SelectionCardItem } from "../ui/selection-card-item";
import { TextInputItem } from "../ui/text-input-item";
import { ToggleItem } from "../ui/toggle-item";

const themeOptions = [
  { value: "light" as const, label: "Light", icon: SunIcon },
  { value: "dark" as const, label: "Dark", icon: MoonIcon },
  { value: "system" as const, label: "System", icon: MonitorIcon },
];

const landingPageOptions = [
  { value: "suggestions" as const, label: "Prompts", description: "Show some suggested prompts" },
  { value: "greeting" as const, label: "Greeting", description: "Simple welcome message" },
  { value: "blank" as const, label: "Blank", description: "Render nothing: blank slate" },
];

const sendMessageKeyboardShortcutOptions = [
  { value: "enter" as const, label: <Kbd>Enter</Kbd> },
  { value: "ctrlEnter" as const, label: <Kbd>Ctrl + Enter</Kbd> },
  { value: "shiftEnter" as const, label: <Kbd>Shift + Enter</Kbd> },
];

export function PreferencesTab() {
  const { data: settings, isLoading } = useUserSettings({ enabled: true });
  const updatePreferences = useUpdatePreferences();
  const { setTheme: applyTheme } = useTheme();

  // Local state only for text fields (to avoid saving on every keystroke)
  const [defaultThreadName, setDefaultThreadName] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  // Sync text fields when settings load or change externally
  useEffect(() => {
    if (settings) {
      setDefaultThreadName(settings.defaultThreadName);
      setCustomInstructions(settings.customInstructions ?? "");
    }
  }, [settings]);

  const save = async (patch: PreferencesUpdate) => {
    try {
      await updatePreferences.mutateAsync(patch);

      if (patch.theme) {
        applyTheme(patch.theme);
      }
      if (patch.boringMode !== undefined) {
        if (patch.boringMode) {
          document.documentElement.classList.add("boring");
        }
        else {
          document.documentElement.classList.remove("boring");
        }
      }
    }
    catch (error) {
      console.error("Failed to save preferences:", error);
      const message = error instanceof Error ? error.message : "Failed to save preferences";
      toast.error(message);
    }
  };

  if (isLoading || !settings) {
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
        <div className="mx-auto max-w-md space-y-8">
          {/* Appearance & Interface */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="text-foreground text-sm font-semibold">Appearance & Interface</h4>
              <p className="text-muted-foreground text-xs">Customize the look and feel of the application.</p>
            </div>

            {/* Theme Selection */}
            <SelectionCardItem
              label="Theme"
              options={themeOptions}
              value={settings.theme}
              onChange={value => save({ theme: value })}
              layout="grid"
              columns={3}
            />

            {/* Boring Mode Toggle */}
            <ToggleItem
              label="Boring Mode"
              description="Disable the green accent for a lamer look."
              enabled={settings.boringMode}
              onToggle={enabled => save({ boringMode: enabled })}
            />

            {/* Input Height Scale */}
            <div className="space-y-2">
              <Label htmlFor="inputHeightScale">Input Box Height</Label>
              <p className="text-muted-foreground text-xs">
                Control how much the input box expands based on content. "None" keeps it compact, "Lots" expands up to 15 lines.
              </p>
              <Slider
                id="inputHeightScale"
                type="range"
                min="0"
                max="4"
                step="1"
                value={settings.inputHeightScale ?? 0}
                onChange={(e) => {
                  const newScale = Number.parseInt(e.target.value, 10);
                  save({ inputHeightScale: newScale });
                }}
                labels={["None", "Lots"]}
              />
            </div>
          </div>

          <Separator />

          {/* Chat Experience */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="text-foreground text-sm font-semibold">Chat Experience</h4>
              <p className="text-muted-foreground text-xs">Configure how chats behave and what you see when starting new conversations.</p>
            </div>

            {/* Landing Page Content */}
            <SelectionCardItem
              label="New Chat Landing Page"
              options={landingPageOptions}
              value={settings.landingPageContent}
              onChange={value => save({ landingPageContent: value })}
              layout="flex"
            />

            {/* Default Thread Name */}
            <TextInputItem
              label="Default Thread Name"
              description="The default name for new chat threads."
              value={defaultThreadName}
              placeholder="New Chat"
              onChange={setDefaultThreadName}
              onBlur={() => {
                if (defaultThreadName !== settings.defaultThreadName) {
                  save({ defaultThreadName });
                }
              }}
            />

            {/* Automatic Thread Renaming */}
            <ToggleItem
              label="Automatic Thread Renaming"
              description="Automatically generate a short title for new conversations."
              enabled={settings.autoThreadNaming}
              onToggle={enabled => save({ autoThreadNaming: enabled })}
            />

            {/* Send Message Keyboard Shortcut */}
            <SelectionCardItem
              label="Send Message Keyboard Shortcut"
              description="Choose which keyboard shortcut to use for sending messages."
              options={sendMessageKeyboardShortcutOptions}
              value={settings.sendMessageKeyboardShortcut}
              onChange={value => save({ sendMessageKeyboardShortcut: value })}
              layout="flex"
            />

            {/* Custom Instructions */}
            <TextInputItem
              label="Custom Instructions"
              description="These instructions will be included in every conversation."
              value={customInstructions}
              placeholder="Add any custom instructions for the AI assistant..."
              size="multi"
              onChange={setCustomInstructions}
              onBlur={() => {
                if (customInstructions !== (settings.customInstructions ?? "")) {
                  save({ customInstructions });
                }
              }}
            />
          </div>

          <Separator />

          {/* Advanced Features */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="text-foreground text-sm font-semibold">Advanced Features</h4>
              <p className="text-muted-foreground text-xs">Additional features that may incur costs or require special setup.</p>
            </div>

            {/* OCR for PDF Uploads */}
            <ToggleItem
              label="OCR for PDF Uploads"
              description="Automatically extract text from PDF uploads using mistral-ocr (recommended for image-dense PDFs). $2 per 1000 pages."
              enabled={settings.useOcrForPdfs}
              onToggle={enabled => save({ useOcrForPdfs: enabled })}
            />
          </div>
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
