import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

export function ToggleItem({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex flex-col space-y-1">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}