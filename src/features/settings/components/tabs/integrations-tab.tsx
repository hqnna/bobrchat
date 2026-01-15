"use client";

import {
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  SaveIcon,
  ServerIcon,
  SmartphoneIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { ApiKeyProvider } from "~/lib/api-keys/types";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { useChatUIStore } from "~/features/chat/store";
import { useRemoveApiKey, useSetApiKey, useUserSettings } from "~/features/settings/hooks/use-user-settings";
import { cn } from "~/lib/utils";

import { apiKeyUpdateSchema } from "../../types";
import { SelectionCardItem } from "../ui/selection-card-item";

type StorageType = "client" | "server";

const storageOptions = [
  {
    value: "client" as const,
    label: "Browser Only",
    description: "Stored locally in your browser",
    icon: SmartphoneIcon,
  },
  {
    value: "server" as const,
    label: "Encrypted Server",
    description: "Stored encrypted on the server",
    icon: ServerIcon,
  },
];

function useApiKeyState(provider: ApiKeyProvider) {
  const { data: settings, isLoading } = useUserSettings({ enabled: true });
  const clientKey = useChatUIStore(s =>
    provider === "openrouter" ? s.openrouterKey : s.parallelKey,
  );

  const hasClientKey = !!clientKey;
  const hasServerKey = settings?.configuredApiKeys?.[provider] ?? false;

  return {
    hasKey: hasClientKey || hasServerKey,
    source: hasClientKey ? "client" as const : hasServerKey ? "server" as const : null,
    isLoading,
  };
}

export function IntegrationsTab() {
  const { data: settings, isLoading } = useUserSettings({ enabled: true });
  const setApiKeyMutation = useSetApiKey();
  const removeApiKeyMutation = useRemoveApiKey();

  const setOpenrouterKey = useChatUIStore(state => state.setOpenRouterKey);
  const setParallelKey = useChatUIStore(state => state.setParallelKey);
  const removeOpenrouterKey = useChatUIStore(state => state.removeOpenRouterKey);
  const removeParallelKey = useChatUIStore(state => state.removeParallelKey);

  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [showOpenRouterApiKey, setShowOpenRouterApiKey] = useState(false);
  const [storageType, setStorageType] = useState<StorageType | null>(null);

  const [parallelApiKey, setParallelApiKeyValue] = useState("");
  const [showParallelApiKey, setShowParallelApiKey] = useState(false);
  const [parallelStorageType, setParallelStorageType] = useState<StorageType | null>(null);

  const { hasKey: hasOpenRouterKey, source: openRouterSource, isLoading: isOpenRouterLoading } = useApiKeyState("openrouter");
  const { hasKey: hasParallelKey, source: parallelSource, isLoading: isParallelLoading } = useApiKeyState("parallel");

  const handleSave = async () => {
    if (!openRouterApiKey.trim())
      return;

    const finalStorageType = storageType || openRouterSource;
    if (!finalStorageType)
      return;

    try {
      const validated = apiKeyUpdateSchema.parse({
        apiKey: openRouterApiKey.trim(),
        storeServerSide: finalStorageType === "server",
      });

      if (validated.storeServerSide) {
        await setApiKeyMutation.mutateAsync({
          provider: "openrouter",
          apiKey: validated.apiKey,
        });
      }
      else {
        setOpenrouterKey(validated.apiKey);
      }
      setOpenRouterApiKey("");
      setStorageType(null);
      toast.success(hasOpenRouterKey ? "API key updated" : "API key saved");
    }
    catch (error) {
      console.error("Failed to save API key:", error);
      const message = error instanceof z.ZodError
        ? error.issues.map(e => e.message).join(", ")
        : error instanceof Error
          ? error.message
          : "Failed to save API key";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await removeApiKeyMutation.mutateAsync("openrouter");
      removeOpenrouterKey();
      setStorageType(null);
      toast.success("API key removed");
    }
    catch {
      toast.error("Failed to remove API key");
    }
  };

  const handleParallelSave = async () => {
    if (!parallelApiKey.trim())
      return;

    const finalStorageType = parallelStorageType || parallelSource;
    if (!finalStorageType)
      return;

    try {
      const validated = apiKeyUpdateSchema.parse({
        apiKey: parallelApiKey.trim(),
        storeServerSide: finalStorageType === "server",
      });

      if (validated.storeServerSide) {
        await setApiKeyMutation.mutateAsync({
          provider: "parallel",
          apiKey: validated.apiKey,
        });
      }
      else {
        setParallelKey(validated.apiKey);
      }
      setParallelApiKeyValue("");
      setParallelStorageType(null);
      toast.success(hasParallelKey ? "API key updated" : "API key saved");
    }
    catch (error) {
      console.error("Failed to save API key:", error);
      const message = error instanceof z.ZodError
        ? error.issues.map(e => e.message).join(", ")
        : error instanceof Error
          ? error.message
          : "Failed to save API key";
      toast.error(message);
    }
  };

  const handleParallelDelete = async () => {
    try {
      await removeApiKeyMutation.mutateAsync("parallel");
      removeParallelKey();
      setParallelStorageType(null);
      toast.success("API key removed");
    }
    catch {
      toast.error("Failed to remove API key");
    }
  };

  if (isLoading || isOpenRouterLoading || isParallelLoading || !settings) {
    return <IntegrationsTabSkeleton />;
  }

  const isSaving = setApiKeyMutation.isPending && setApiKeyMutation.variables?.provider === "openrouter";
  const isDeleting = removeApiKeyMutation.isPending && removeApiKeyMutation.variables === "openrouter";
  const isParallelSaving = setApiKeyMutation.isPending && setApiKeyMutation.variables?.provider === "parallel";
  const isParallelDeleting = removeApiKeyMutation.isPending && removeApiKeyMutation.variables === "parallel";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-muted-foreground text-sm">
          Manage your API keys and external service connections.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-8">
          {/* OpenRouter API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="size-5" />
              <h4 className="font-medium">OpenRouter API Key</h4>
              {hasOpenRouterKey
                ? (
                    <Badge
                      variant="outline"
                      className="border-primary bg-primary/10"
                    >
                      <span className="text-xs">
                        Configured
                      </span>
                    </Badge>
                  )
                : (
                    <Badge variant="outline">
                      <span className="text-xs">Not Configured</span>
                    </Badge>
                  )}
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              OpenRouter provides access to a variety of AI models.
            </p>

            {/* API Key Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">
                  {hasOpenRouterKey ? "Update API Key" : "Enter API Key"}
                </Label>
              </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showOpenRouterApiKey ? "text" : "password"}
                    value={openRouterApiKey}
                    onChange={e => setOpenRouterApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterApiKey(!showOpenRouterApiKey)}
                    className={cn(`
                      text-muted-foreground absolute top-1/2 right-3
                      -translate-y-1/2 transition-colors
                      hover:text-foreground
                    `)}
                  >
                    {showOpenRouterApiKey
                      ? <EyeOffIcon className="size-4" />
                      : <EyeIcon className="size-4" />}
                  </button>
                </div>
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
            <SelectionCardItem
              label="Storage Method"
              options={storageOptions}
              value={storageType || openRouterSource}
              onChange={setStorageType}
              layout="grid"
              columns={2}
              required={!hasOpenRouterKey}
              lockedMessage={hasOpenRouterKey && openRouterSource ? "Storage method is locked. Delete your key to change it." : undefined}
              helperText={(selected) => {
                if (hasOpenRouterKey) {
                  return "Storage method is locked. Delete your key to change it.";
                }
                if (selected === "server") {
                  return "Your key will be encrypted and stored securely on our servers.";
                }
                if (selected === "client") {
                  return "Your key stays in your browser and is never sent to our servers.";
                }
                return "Select a storage method to continue.";
              }}
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={!openRouterApiKey.trim() || (!storageType && !hasOpenRouterKey) || isSaving}
              >
                <SaveIcon className="size-4" />
                {isSaving ? "Saving..." : hasOpenRouterKey ? "Update Key" : "Save Key"}
              </Button>
              {hasOpenRouterKey && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <TrashIcon className="size-4" />
                  {isDeleting ? "Removing..." : "Remove"}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Parallel.ai API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="size-5" />
              <h4 className="font-medium">Parallel.ai API Key</h4>
              {hasParallelKey
                ? (
                    <Badge
                      variant="outline"
                      className="border-primary bg-primary/10"
                    >
                      <span className="text-xs">
                        Configured
                      </span>
                    </Badge>
                  )
                : (
                    <Badge variant="outline">
                      <span className="text-xs">Not Configured</span>
                    </Badge>
                  )}
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              Parallel Search lets your AI access and search the live web in real-time to answer your questions more accurately.
            </p>

            {/* API Key Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="parallelApiKey">
                  {hasParallelKey ? "Update API Key" : "Enter API Key"}
                </Label>
              </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="parallelApiKey"
                    type={showParallelApiKey ? "text" : "password"}
                    value={parallelApiKey}
                    onChange={e => setParallelApiKeyValue(e.target.value)}
                    placeholder="pr_..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParallelApiKey(!showParallelApiKey)}
                    className={cn(`
                      text-muted-foreground absolute top-1/2 right-3
                      -translate-y-1/2 transition-colors
                      hover:text-foreground
                    `)}
                  >
                    {showParallelApiKey
                      ? <EyeOffIcon className="size-4" />
                      : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Get your API key from
                {" "}
                <a
                  href="https://platform.parallel.ai/settings?tab=api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    text-primary
                    hover:underline
                  `}
                >
                  platform.parallel.ai/settings
                </a>
              </p>
            </div>

            {/* Storage Type Selection */}
            <SelectionCardItem
              label="Storage Method"
              options={storageOptions}
              value={parallelStorageType || parallelSource}
              onChange={setParallelStorageType}
              layout="grid"
              columns={2}
              required={!hasParallelKey}
              lockedMessage={hasParallelKey && parallelSource ? "Storage method is locked. Delete your key to change it." : undefined}
              helperText={(selected) => {
                if (hasParallelKey) {
                  return "Storage method is locked. Delete your key to change it.";
                }
                if (selected === "server") {
                  return "Your key will be encrypted and stored securely on our servers.";
                }
                if (selected === "client") {
                  return "Your key stays in your browser and is never sent to our servers.";
                }
                return "Select a storage method to continue.";
              }}
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleParallelSave}
                disabled={!parallelApiKey.trim() || (!parallelStorageType && !hasParallelKey) || isParallelSaving}
              >
                <SaveIcon className="size-4" />
                {isParallelSaving ? "Saving..." : hasParallelKey ? "Update Key" : "Save Key"}
              </Button>
              {hasParallelKey && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9"
                  onClick={handleParallelDelete}
                  disabled={isParallelDeleting}
                >
                  <TrashIcon className="size-4" />
                  {isParallelDeleting ? "Removing..." : "Remove"}
                </Button>
              )}
            </div>
          </div>
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
