import { KeyIcon, ServerIcon, SmartphoneIcon } from "lucide-react";

import { Badge } from "~/components/ui/badge";

export function ApiKeysMockup() {
  return (
    <div className={`
      border-border bg-background w-full max-w-sm space-y-4 border p-4 shadow-sm
    `}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <KeyIcon className="size-4" />
        <span className="text-sm font-medium">OpenRouter API Key</span>
        <Badge variant="outline" className="border-primary bg-primary/10">
          <span className="text-xs">Configured</span>
        </Badge>
      </div>

      {/* Input mockup */}
      <div className={`
        border-border bg-muted/30 flex h-9 items-center border px-3
      `}
      >
        <span className="text-muted-foreground font-mono text-sm">
          sk-or-v1-••••••••••••••••
        </span>
      </div>

      {/* Storage options */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`
          border-border bg-muted/30 flex items-center gap-2 border p-2
        `}
        >
          <SmartphoneIcon className="text-muted-foreground size-4" />
          <div>
            <div className="text-xs font-medium">Browser Only</div>
            <div className="text-muted-foreground text-[10px]">Stored locally</div>
          </div>
        </div>
        <div className={`
          border-primary bg-primary/10 flex items-center gap-2 border p-2
        `}
        >
          <ServerIcon className="text-primary size-4" />
          <div>
            <div className="text-primary text-xs font-medium">Encrypted Server</div>
            <div className="text-primary/70 text-[10px]">Selected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
