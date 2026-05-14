import { Badge } from "@/components/ui/badge";
import { MASTERY_LEVELS } from "@/lib/constants";

export function MasteryBadge({ level }: { level: string }) {
  const config = MASTERY_LEVELS[level as keyof typeof MASTERY_LEVELS];
  if (!config) return null;
  return (
    <Badge variant="secondary" className={`${config.color} border font-medium`}>
      {config.label}
    </Badge>
  );
}
