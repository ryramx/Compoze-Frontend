import { useState } from "react";
import { UserPlus, Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/compoze/UserAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { User } from "@/types";

export function CollaboratorsDialog({
  songId,
  collaborators,
  allUsers,
  onInvite,
  totalPercent,
  fullWidth,
}: {
  songId: string;
  collaborators: { userId: string; percentage: number }[];
  allUsers: User[];
  onInvite: (songId: string, userId: string, percentage?: number) => void;
  onSetPercentage: (songId: string, userId: string, percentage: number) => void;
  totalPercent: number;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const candidates = allUsers.filter((u) => !collaborators.some((c) => c.userId === u.id));
  const sumMismatch = totalPercent !== 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={fullWidth ? "lg" : "sm"}
          variant="outline"
          className={cn("rounded-full border-border/60", fullWidth && "h-12 w-full rounded-2xl")}
        >
          <UserPlus className="h-4 w-4" /> Convidar colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wifi className="h-4 w-4 text-author-3" />
            Convidar colaboradores
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Convide compositores para co-autoria. Eles entram automaticamente como coautores e suas contribuições ficam destacadas em cor.
        </p>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {candidates.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              Todos os seus contatos já estão na canção.
            </div>
          )}
          {candidates.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2">
              <UserAvatar user={u} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{u.name}</div>
                <div className="text-xs text-muted-foreground">@{u.username}</div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onInvite(songId, u.id, 0);
                  toast.success(`${u.name} entrou na sessão`);
                }}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Convidar
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter className="flex-col items-stretch gap-1 border-t border-border/60 pt-3 text-xs text-muted-foreground sm:items-stretch">
          <div>
            Soma atual de coautoria:{" "}
            <span className={cn("font-mono", sumMismatch ? "text-status-revisao" : "text-foreground")}>
              {totalPercent}%
            </span>
          </div>
          {sumMismatch && (
            <div className="text-status-revisao">
              A soma dos percentuais ainda não fecha 100% — ajuste antes de formalizar a coautoria.
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
