import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

export function TextInputItem({
  label,
  description,
  value,
  placeholder,
  size = "single",
  onChange,
  onBlur,
}: {
  label: string;
  description: string;
  value: string;
  placeholder?: string;
  size?: "single" | "multi";
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {size === "single"
        ? (
            <Input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
            />
          )
        : (
            <Textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={onBlur}
              placeholder={placeholder}
              className="h-32"
            />
          )}
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}