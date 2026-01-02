"use client";

import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  SaveIcon,
  ServerIcon,
  SmartphoneIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "~/lib/utils";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { useUserSettingsContext } from "./user-settings-provider";

type StorageType = "client" | "server";

const storageOptions: { value: StorageType; label: string; description: string; icon: typeof ServerIcon }[] = [
  {
    value: "client",
    label: "Browser Only",
    description: "Stored locally in your browser",
    icon: SmartphoneIcon,
  },
  {
    value: "server",
    label: "Encrypted Server",
    description: "Stored encrypted on the server",
    icon: ServerIcon,
  },
];

export function IntegrationsTab() {
  const { settings, loading, setApiKey, removeApiKey } = useUserSettingsContext();
  const initializedRef = useRef(false);

  const [apiKey, setApiKeyValue] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [storageType, setStorageType] = useState<StorageType>(
    () => settings?.apiKeyStorage?.openrouter ?? "client",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasExistingKey = settings?.apiKeyStorage?.openrouter !== undefined;

  // Sync storage type when settings load for the first time
  if (settings?.apiKeyStorage?.openrouter && !initializedRef.current) {
    initializedRef.current = true;
    if (storageType !== settings.apiKeyStorage.openrouter) {
      setStorageType(settings.apiKeyStorage.openrouter);
    }
  }

  const handleSave = useCallback(async () => {
    if (!apiKey.trim())
      return;

    setIsSaving(true);
    try {
      await setApiKey("openrouter", apiKey, storageType === "server");
      setApiKeyValue("");
    }
    finally {
      setIsSaving(false);
    }
  }, [apiKey, storageType, setApiKey]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await removeApiKey("openrouter");
    }
    finally {
      setIsDeleting(false);
    }
  }, [removeApiKey]);

  if (loading) {
    return <IntegrationsTabSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-muted-foreground text-sm">
          Manage your API keys and external service connections.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* OpenRouter API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="size-5" />
              <h4 className="font-medium">OpenRouter API Key</h4>
            </div>

            {/* Status Indicator */}
            {hasExistingKey
              ? (
                  <div
                    className={cn(`
                      flex items-center gap-2 rounded-lg border
                      border-green-500/20 bg-green-500/10 p-3
                    `)}
                  >
                    <CheckIcon className="size-4 text-green-500" />
                    <span className="text-sm">
                      API key configured (
                      {settings?.apiKeyStorage?.openrouter === "server"
                        ? "encrypted server storage"
                        : "browser storage"}
                      )
                    </span>
                  </div>
                )
              : (
                  <div
                    className={cn(`
                      text-muted-foreground border-muted flex items-center gap-2
                      rounded-lg border p-3
                    `)}
                  >
                    <KeyIcon className="size-4" />
                    <span className="text-sm">No API key configured</span>
                  </div>
                )}

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {hasExistingKey ? "Update API Key" : "Enter API Key"}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={e => setApiKeyValue(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className={cn(`
                    text-muted-foreground absolute top-1/2 right-3
                    -translate-y-1/2 transition-colors
                    hover:text-foreground
                  `)}
                >
                  {showApiKey
                    ? <EyeOffIcon className="size-4" />
                    : (
                        <EyeIcon className="size-4" />
                      )}
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                Get your API key from
                {" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    text-primary
                    hover:underline
                  `}
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            {/* Storage Type Selection */}
            <div className="space-y-3">
              <Label>Storage Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {storageOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = storageType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStorageType(option.value)}
                      className={cn(
                        `
                          flex flex-col items-start gap-1 rounded-lg border p-3
                          text-left transition-colors
                        `,
                        isSelected
                          ? "border-primary bg-primary/5"
                          : `
                            border-input
                            hover:bg-muted
                          `,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                        {isSelected && (
                          <CheckIcon
                            className={cn(`
                              bg-primary text-primary-foreground size-3
                              rounded-full p-0.5
                            `)}
                          />
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-xs">
                {storageType === "server"
                  ? "Your key will be encrypted and stored securely on our servers."
                  : "Your key stays in your browser and is never sent to our servers."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex justify-between">
          {hasExistingKey
            ? (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <TrashIcon className="size-4" />
                  {isDeleting ? "Removing..." : "Remove Key"}
                </Button>
              )
            : (
                <div />
              )}
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim() || isSaving}
          >
            <SaveIcon className="size-4" />
            {isSaving ? "Saving..." : hasExistingKey ? "Update Key" : "Save Key"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IntegrationsTabSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-5 w-36" />
            </div>

            <Skeleton className="h-12 w-full" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
