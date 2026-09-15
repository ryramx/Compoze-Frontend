import { useState } from "react";
import { Check, Tag, Users, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/compoze/UserAvatar";
import type { Song, SongStatus, User } from "@/types";
import { keyOptions, statusOptions, timeSignatureOptions } from "./songOptions";

export function SongMetadataPanel({
  song,
  onUpdate,
  getUser,
}: {
  song: Song;
  onUpdate: (patch: Partial<Song>) => void;
  getUser: (id: string) => User | undefined;
}) {
  const [tagInput, setTagInput] = useState("");
  const tags = song.tags ?? [];
  const creator = getUser(song.creatorId);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    onUpdate({ tags: [...tags, t] });
    setTagInput("");
  };
  const removeTag = (t: string) => onUpdate({ tags: tags.filter((x) => x !== t) });

  return (
    <Card className="mb-6 overflow-hidden border-border/60 bg-gradient-card p-0 shadow-sm md:mb-8">
      {/* Author strip */}
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-background/30 px-5 py-3 md:px-6">
        <div className="flex items-center gap-2.5">
          <UserAvatar user={creator} size="sm" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Autor</span>
            <span className="text-sm font-medium">{creator?.name}</span>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <Users className="h-3.5 w-3.5" />
          {song.collaborators.length} {song.collaborators.length === 1 ? "pessoa" : "pessoas"}
        </div>
      </div>

      {/* Musical metadata */}
      <div className="grid grid-cols-3 gap-0 divide-x divide-border/40 px-0 py-0">
        <div className="space-y-1.5 p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tom</div>
          <Select value={song.key ?? ""} onValueChange={(v) => onUpdate({ key: v })}>
            <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/40 font-mono text-sm">
              <SelectValue placeholder="Ex: Am" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {keyOptions.map((k) => (
                <SelectItem key={k} value={k} className="font-mono">
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Compasso</div>
          <Select
            value={song.timeSignature ?? "4/4"}
            onValueChange={(v) => onUpdate({ timeSignature: v })}
          >
            <SelectTrigger className="h-9 rounded-lg border-border/60 bg-background/40 font-mono text-sm">
              <SelectValue placeholder="4/4" />
            </SelectTrigger>
            <SelectContent>
              {timeSignatureOptions.map((t) => (
                <SelectItem key={t} value={t} className="font-mono">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 p-4 md:p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">BPM</div>
          <div className="relative">
            <Input
              type="number"
              inputMode="numeric"
              min={20}
              max={300}
              value={song.bpm ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                onUpdate({ bpm: Number.isFinite(n) && n > 0 ? n : undefined });
              }}
              placeholder="120"
              className="h-9 rounded-lg border-border/60 bg-background/40 pr-10 font-mono text-sm"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] uppercase tracking-widest text-muted-foreground">
              bpm
            </span>
          </div>
        </div>
      </div>

      {/* Mobile status */}
      <div className="border-t border-border/40 px-5 py-4 md:hidden">
        <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
        <Select value={song.status} onValueChange={(v) => onUpdate({ status: v as SongStatus })}>
          <SelectTrigger className="h-9 w-full rounded-full border-border/60 bg-background/40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-background/20 px-5 py-3 md:px-6">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
          >
            #{t}
            <button onClick={() => removeTag(t)} aria-label={`Remover tag ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Adicionar tag"
            className="h-7 w-32 rounded-full bg-background/40 px-3 text-xs"
          />
          {tagInput && (
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={addTag}>
              <Check className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
