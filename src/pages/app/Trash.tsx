import { useEffect } from "react";
import { Music4, Trash2, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCompoze } from "@/store/compozeStore";
import { UserAvatar } from "@/components/compoze/UserAvatar";
import { ConfirmDeleteDialog } from "@/components/compoze/ConfirmDeleteDialog";
import { daysRemaining, listTrashed, TRASH_RETENTION_DAYS } from "@/services/mock/songService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function Trash() {
  const songs = useCompoze((s) => s.songs);
  const getUser = useCompoze((s) => s.getUser);
  const restoreSong = useCompoze((s) => s.restoreSong);
  const permanentlyDeleteSong = useCompoze((s) => s.permanentlyDeleteSong);
  const purgeExpiredTrash = useCompoze((s) => s.purgeExpiredTrash);

  // Simula a varredura automatizada de expiração (RN07/RN08) sempre que a
  // Lixeira é aberta, além da que já roda na inicialização do store.
  useEffect(() => {
    purgeExpiredTrash();
  }, [purgeExpiredTrash]);

  const trashedSongs = listTrashed(songs);

  const restoreAll = () => {
    trashedSongs.forEach((s) => restoreSong(s.id));
    toast.success("Todos os itens foram restaurados");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Lixeira</h1>
          <p className="text-sm text-muted-foreground">
            Itens excluídos ficam aqui por {TRASH_RETENTION_DAYS} dias antes de serem removidos para sempre.
          </p>
        </div>
        {trashedSongs.length > 0 && (
          <Button
            variant="outline"
            className="rounded-full border-border/60"
            onClick={restoreAll}
          >
            <Undo2 className="h-4 w-4" /> Restaurar tudo
          </Button>
        )}
      </div>

      {trashedSongs.length === 0 ? (
        <Card className="grid place-items-center border-dashed border-border/60 bg-transparent p-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/40 text-muted-foreground">
            <Trash2 className="h-6 w-6" />
          </div>
          <div className="mt-4 font-display text-lg font-semibold">Sua lixeira está vazia</div>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Quando você excluir uma canção, ela aparecerá aqui — e você poderá restaurar com um clique.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-card">
          {trashedSongs.map((s, i) => {
            const owner = getUser(s.creatorId);
            const remaining = daysRemaining(s);
            return (
              <div
                key={s.id}
                className={
                  "flex flex-wrap items-center gap-3 px-4 py-3 " +
                  (i > 0 ? "border-t border-border/60" : "")
                }
              >
                <Music4 className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Canção · Excluída em{" "}
                    {s.deletedAt && format(new Date(s.deletedAt), "d 'de' MMMM, yyyy", { locale: ptBR })}
                    {" · "}
                    {remaining > 0
                      ? `restam ${remaining} ${remaining === 1 ? "dia" : "dias"}`
                      : "expirado — removida em breve"}
                  </div>
                </div>
                {owner && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserAvatar user={owner} size="xs" />
                    {owner.name}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-border/60"
                    onClick={() => {
                      restoreSong(s.id);
                      toast.success("Canção restaurada");
                    }}
                  >
                    <Undo2 className="h-3.5 w-3.5" /> Restaurar
                  </Button>
                  <ConfirmDeleteDialog
                    title={s.title}
                    description="Esta ação é definitiva e não pode ser desfeita. A canção será removida para sempre."
                    onConfirm={() => {
                      permanentlyDeleteSong(s.id);
                      toast.success("Canção excluída definitivamente");
                    }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir definitivamente
                    </Button>
                  </ConfirmDeleteDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
