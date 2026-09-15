import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";

// Apenas os atalhos que de fato funcionam hoje no editor (Undo2/Redo2 em
// SongEditor.tsx) — não lista atalhos não implementados (ex.: Ctrl/Cmd+S,
// que não existe pois não há salvamento real nesta fase).
const shortcuts = [
  { keys: "Ctrl / Cmd + Z", label: "Desfazer" },
  { keys: "Ctrl / Cmd + Shift + Z", label: "Refazer" },
];

export function HelpDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" /> Ajuda
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Atalhos de teclado — Song Workspace
          </div>
          <div className="space-y-2">
            {shortcuts.map((s) => (
              <div key={s.keys} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <kbd className="rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
