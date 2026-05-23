import { Badge } from "@/components/ui/badge";
import { SUBJECTS } from "@/lib/constants";

export function SubjectTag({ subject }: { subject: string }) {
  const config = SUBJECTS[subject as keyof typeof SUBJECTS];
  if (!config) return null;
  return (
    <Badge variant="secondary" className={`${config.color} border font-medium`}>
      {config.label}
    </Badge>
  );
}
