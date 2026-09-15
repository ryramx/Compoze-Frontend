import { Hash, Music2, StickyNote, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

export type InsertableBlockType = "section" | "chord-line" | "lyric-line" | "note";

export function BlockInsertButtons({
  onInsert,
}: {
  onInsert: (type: InsertableBlockType) => void;
}) {
  const items = [
    { type: "section" as const, label: "Seção", icon: Hash },
    { type: "chord-line" as const, label: "Acordes", icon: Music2 },
    { type: "lyric-line" as const, label: "Letra", icon: Type },
    { type: "note" as const, label: "Nota", icon: StickyNote },
  ];
  return (
    <>
      {items.map((t) => (
        <Button
          key={t.type}
          size="sm"
          variant="outline"
          className="rounded-full border-border/60 bg-background/40"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onInsert(t.type)}
        >
          <t.icon className="h-3.5 w-3.5" /> {t.label}
        </Button>
      ))}
    </>
  );
}
