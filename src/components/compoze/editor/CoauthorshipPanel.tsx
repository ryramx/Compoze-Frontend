import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { UserAvatar } from "@/components/compoze/UserAvatar";
import { cn } from "@/lib/utils";
import type { Contribution, User } from "@/types";

// Não representa autoria legal — apenas o percentual de coautoria que os
// colaboradores acordaram entre si (ver seção 12 do PRD). "Quem editou um
// bloco" (identificação visual no editor) permanece uma informação
// separada desta.
export function CoauthorshipPanel({
  collaborators,
  getUser,
  onSetPercentage,
}: {
  collaborators: Contribution[];
  getUser: (id: string) => User | undefined;
  onSetPercentage: (userId: string, percentage: number) => void;
}) {
  const totalPercent = collaborators.reduce((acc, c) => acc + c.percentage, 0);
  const sumMismatch = totalPercent !== 100;

  return (
    <Card className="mt-10 border-border/60 bg-gradient-card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Users className="h-3 w-3" /> Coautoria — soma {totalPercent}%
        {sumMismatch && (
          <span className="normal-case tracking-normal text-status-revisao">
            A soma ainda não fecha 100%
          </span>
        )}
      </div>
      <div className="space-y-3">
        {collaborators.map((c) => {
          const u = getUser(c.userId);
          if (!u) return null;
          return (
            <div key={c.userId} className="flex items-center gap-3">
              <UserAvatar user={u} size="sm" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{u.name}</span>
                  <span className={cn("font-mono text-xs", `text-author-${u.authorColor}`)}>
                    {c.percentage}%
                  </span>
                </div>
                <Slider
                  value={[c.percentage]}
                  max={100}
                  step={5}
                  onValueChange={(v) => onSetPercentage(c.userId, v[0])}
                  className="mt-2"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
