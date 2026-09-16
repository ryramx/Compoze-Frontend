import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Share2,
  Undo2,
  Redo2,
  Music2,
  Music4,
} from "lucide-react";
import { useCompoze } from "@/store/compozeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/compoze/UserAvatar";
import type { SongBlock, SongStatus } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/compoze/ConfirmDeleteDialog";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useFakeCollaboratorCursors } from "@/hooks/useFakeCollaboratorCursors";
import { BlockInsertButtons } from "@/components/compoze/editor/BlockInsertButtons";
import { EditorBlock } from "@/components/compoze/editor/EditorBlock";
import { CollaboratorsDialog } from "@/components/compoze/editor/CollaboratorsDialog";
import { SongMetadataPanel } from "@/components/compoze/editor/SongMetadataPanel";
import { CoauthorshipPanel } from "@/components/compoze/editor/CoauthorshipPanel";
import { statusOptions } from "@/components/compoze/editor/songOptions";

interface Snapshot {
  title: string;
  blocks: SongBlock[];
  key?: string;
  bpm?: number;
  timeSignature?: string;
  tags?: string[];
}

export default function SongEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const song = useCompoze((s) => (id ? s.getSong(id) : undefined));
  const me = useCompoze((s) => s.users.find((u) => u.id === s.currentUserId)!);
  const allUsers = useCompoze((s) => s.users);
  const getUser = useCompoze((s) => s.getUser);
  const updateSong = useCompoze((s) => s.updateSong);
  const updateBlock = useCompoze((s) => s.updateBlock);
  const insertBlock = useCompoze((s) => s.insertBlock);
  const removeBlock = useCompoze((s) => s.removeBlock);
  const inviteCollaborator = useCompoze((s) => s.inviteCollaborator);
  const setContribution = useCompoze((s) => s.setContribution);
  const deleteSong = useCompoze((s) => s.deleteSong);
  const restoreSong = useCompoze((s) => s.restoreSong);

  const otherCollaborators = useMemo(
    () => song?.collaborators.filter((c) => c.userId !== me.id).map((c) => c.userId) ?? [],
    [song?.collaborators, me.id],
  );
  const [savingPulse, setSavingPulse] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  // Ocultar cifras dá ao letrista uma leitura limpa da letra, sem os acordes
  // quebrando o texto. Só esconde na exibição: os blocos continuam intactos.
  const [showChords, setShowChords] = useState(true);
  const blocksAreaRef = useRef<HTMLDivElement>(null);
  const blocksEndRef = useRef<HTMLDivElement>(null);
  // Keep track of the last block the user was editing, even after blur
  // (e.g. when they tap a toolbar button which momentarily steals focus).
  // This is what we use to decide WHERE to insert a new block.
  const lastFocusedBlockIdRef = useRef<string | null>(null);

  const cursors = useFakeCollaboratorCursors(song?.id, otherCollaborators, song?.blocks);

  // ---------- Undo / Redo history ----------
  // We snapshot the editable parts of the song (blocks + title + metadata fields)
  // with a small debounce so each "edit burst" becomes a single history entry.
  const snapshotValue = useMemo<Snapshot | undefined>(
    () =>
      song
        ? {
            title: song.title,
            blocks: song.blocks,
            key: song.key,
            bpm: song.bpm,
            timeSignature: song.timeSignature,
            tags: song.tags,
          }
        : undefined,
    [song?.title, song?.blocks, song?.key, song?.bpm, song?.timeSignature, song?.tags],
  );
  const { undo: handleUndo, redo: handleRedo, canUndo, canRedo } = useUndoRedo<Snapshot>(
    snapshotValue,
    (snap) => {
      if (!song) return;
      updateSong(song.id, snap);
    },
  );

  // Keyboard shortcuts: Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Floating toolbar: stays visible whenever the writing area itself is on
  // screen AND the user has not yet scrolled past the end of the blocks.
  // When the end-of-writing sentinel becomes visible, we hide the floating
  // bar so the inline toolbar takes over, keeping the bottom of the page
  // (coautoria, compartilhar, excluir) free of overlap.
  useEffect(() => {
    const area = blocksAreaRef.current;
    const end = blocksEndRef.current;
    if (!area || !end) return;
    let areaVisible = false;
    let endVisible = false;
    const update = () => setShowFloatingToolbar(areaVisible && !endVisible);
    const areaObs = new IntersectionObserver(
      ([entry]) => {
        areaVisible = entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    const endObs = new IntersectionObserver(
      ([entry]) => {
        endVisible = entry.isIntersecting;
        update();
      },
      // Trigger a bit before the sentinel so the floating bar releases
      // before it overlaps the coautoria / actions area.
      { rootMargin: "0px 0px -120px 0px", threshold: 0 },
    );
    areaObs.observe(area);
    endObs.observe(end);
    return () => {
      areaObs.disconnect();
      endObs.disconnect();
    };
  }, [song?.id]);

  // Blocos efetivamente renderizados. Ocultar cifras é só exibição: os blocos
  // continuam no documento, então ligar de volta não perde nada.
  const visibleBlocks = useMemo(
    () =>
      showChords
        ? (song?.blocks ?? [])
        : (song?.blocks ?? []).filter((b) => b.type !== "chord-line"),
    [song?.blocks, showChords],
  );

  // Pulse "saving" indicator briefly whenever song updates
  useEffect(() => {
    if (!song) return;
    setSavingPulse(true);
    const t = setTimeout(() => setSavingPulse(false), 900);
    return () => clearTimeout(t);
  }, [song?.updatedAt]);

  if (!song) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="text-muted-foreground">Canção não encontrada.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/songs">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>
    );
  }

  if (song.deletedAt) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8 text-center">
        <p className="text-muted-foreground">
          "{song.title}" está na lixeira. Restaure-a para continuar editando.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={() => {
              restoreSong(song.id);
              toast.success("Canção restaurada");
            }}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Undo2 className="h-4 w-4" /> Restaurar canção
          </Button>
          <Button asChild variant="ghost">
            <Link to="/trash">Ver lixeira</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalPercent = song.collaborators.reduce((acc, c) => acc + c.percentage, 0);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/songs/${song.id}/edit`);
    }
    toast.success("Link da canção copiado ✨");
  };
  const handleDelete = () => {
    if (!song) return;
    deleteSong(song.id);
    toast.success("Canção movida para a Lixeira");
    navigate("/songs");
  };

  // Context-aware block insertion based on the user's cursor position.
  // - Section focused: insert NEW block (any type) BELOW the section.
  // - Lyric line focused + inserting chords: insert ABOVE (chord must
  //   sit above the lyric it relates to, for visual alignment).
  // - Any other case: insert BELOW the focused block.
  // - No focus at all: append at the end (fallback).
  const handleInsertBlock = (type: "section" | "chord-line" | "lyric-line" | "note") => {
    const newBlock = {
      type,
      label: type === "section" ? "Nova seção" : undefined,
      text: "",
      authorId: me.id,
    };
    const anchorId = focusedBlockId ?? lastFocusedBlockIdRef.current;
    const anchor = anchorId ? song.blocks.find((b) => b.id === anchorId) : undefined;
    let options: { afterId?: string; beforeId?: string } | undefined;
    if (anchor) {
      if (type === "chord-line" && anchor.type === "lyric-line") {
        options = { beforeId: anchor.id };
      } else {
        options = { afterId: anchor.id };
      }
    }
    const newId = insertBlock(song.id, newBlock, options);
    setPendingFocusId(newId);
    setFocusedBlockId(newId);
    lastFocusedBlockIdRef.current = newId;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Document toolbar — flush with the global top header */}
      <div className="sticky top-16 z-20 flex items-center gap-2 border-b border-border/60 bg-background/90 px-3 py-2.5 backdrop-blur-xl md:gap-3 md:px-6 md:py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={() => navigate("/songs")}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Input
          value={song.title}
          onChange={(e) => updateSong(song.id, { title: e.target.value })}
          className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 font-display text-base font-semibold focus-visible:ring-1 md:text-lg"
        />

        {/* Mostrar / ocultar cifras */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 rounded-full",
            !showChords && "text-muted-foreground/50",
          )}
          onClick={() => setShowChords((v) => !v)}
          title={showChords ? "Ocultar acordes" : "Mostrar acordes"}
          aria-label={showChords ? "Ocultar acordes" : "Mostrar acordes"}
          aria-pressed={showChords}
        >
          {showChords ? <Music2 className="h-4 w-4" /> : <Music4 className="h-4 w-4" />}
        </Button>

        {/* Undo / Redo */}
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl/Cmd+Z)"
            aria-label="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl/Cmd+Shift+Z)"
            aria-label="Refazer"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile live indicator */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-author-3/10 px-2 py-1 text-[10px] font-medium text-author-3 md:hidden">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-author-3" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-author-3" />
          </span>
          {song.collaborators.length}
        </div>

        {/* Saving indicator */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-1 text-[10px] text-muted-foreground">
          <span className={cn("relative flex h-1.5 w-1.5", savingPulse && "animate-pulse")}>
            <span className="absolute inline-flex h-full w-full rounded-full bg-status-finalizada/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-finalizada" />
          </span>
          <span className="hidden sm:inline">{savingPulse ? "Salvando…" : "Salvo"}</span>
        </div>

        <div className="ml-1 hidden items-center gap-3 md:flex">
          <Select
            value={song.status}
            onValueChange={(v) => updateSong(song.id, { status: v as SongStatus })}
          >
            <SelectTrigger className="h-8 w-36 rounded-full border-border/60 bg-muted/40 text-xs">
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

          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-full bg-author-3/10 px-3 py-1 text-xs text-author-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-author-3" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-author-3" />
            </span>
            Ao vivo · {song.collaborators.length}
          </div>

          <div className="flex -space-x-2">
            {song.collaborators.map((c) => {
              const u = getUser(c.userId);
              if (!u) return null;
              return (
                <div key={c.userId} className="rounded-full ring-2 ring-background">
                  <UserAvatar user={u} size="sm" ring />
                </div>
              );
            })}
          </div>

          <CollaboratorsDialog
            songId={song.id}
            collaborators={song.collaborators}
            allUsers={allUsers}
            onInvite={inviteCollaborator}
            onSetPercentage={setContribution}
            totalPercent={totalPercent}
          />

          <Button size="sm" variant="outline" onClick={handleShare} className="rounded-full border-border/60">
            <Share2 className="h-4 w-4" /> Compartilhar
          </Button>

          <ConfirmDeleteDialog onConfirm={handleDelete} title={song.title}>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </ConfirmDeleteDialog>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-6 md:px-10 md:pb-10 md:pt-8">
          <SongMetadataPanel
            song={song}
            onUpdate={(patch) => updateSong(song.id, patch)}
            getUser={getUser}
          />

          <div ref={blocksAreaRef} className="space-y-0.5">
            {visibleBlocks.map((b) => (
              <EditorBlock
                key={b.id}
                block={b}
                authorColor={getUser(b.authorId)?.authorColor ?? 1}
                authorName={getUser(b.authorId)?.name ?? ""}
                isMine={b.authorId === me.id}
                onChange={(text) => updateBlock(song.id, b.id, { text })}
                onLabel={(label) => updateBlock(song.id, b.id, { label })}
                onRemove={() => removeBlock(song.id, b.id)}
                cursors={cursors.filter((c) => c.blockId === b.id)}
                getUser={getUser}
                onFocus={() => {
                  setFocusedBlockId(b.id);
                  lastFocusedBlockIdRef.current = b.id;
                }}
                onBlur={() => setFocusedBlockId((cur) => (cur === b.id ? null : cur))}
                isFocused={focusedBlockId === b.id}
                shouldFocus={pendingFocusId === b.id}
                onFocusHandled={() => setPendingFocusId(null)}
                onEnter={() => {
                  const newId = insertBlock(
                    song.id,
                    { type: "lyric-line", text: "", authorId: me.id },
                    { afterId: b.id },
                  );
                  setPendingFocusId(newId);
                  setFocusedBlockId(newId);
                }}
              />
            ))}
            <div ref={blocksEndRef} aria-hidden className="h-px w-full" />
          </div>

          {/* Inline add-block toolbar (hidden while floating bar is shown) */}
          <div
            className={cn(
              "mt-6 flex flex-wrap gap-2 transition-opacity",
              showFloatingToolbar && "pointer-events-none opacity-0",
            )}
          >
            <BlockInsertButtons onInsert={(type) => handleInsertBlock(type)} />
          </div>

          <CoauthorshipPanel
            collaborators={song.collaborators}
            getUser={getUser}
            onSetPercentage={(userId, percentage) => setContribution(song.id, userId, percentage)}
          />

          {/* Mobile-only invite */}
          <div className="mt-6 md:hidden">
            <CollaboratorsDialog
              songId={song.id}
              collaborators={song.collaborators}
              allUsers={allUsers}
              onInvite={inviteCollaborator}
              onSetPercentage={setContribution}
              totalPercent={totalPercent}
              fullWidth
            />
          </div>

          {/* Mobile share + delete (large) — share above delete */}
          <div className="mt-8 space-y-3 md:hidden">
            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-2xl border-border/60 bg-background/40 text-base"
            >
              <Share2 className="h-5 w-5" /> Compartilhar
            </Button>
            <ConfirmDeleteDialog onConfirm={handleDelete} title={song.title}>
              <Button variant="destructive" size="lg" className="h-12 w-full rounded-2xl text-base">
                <Trash2 className="h-5 w-5" /> Excluir canção
              </Button>
            </ConfirmDeleteDialog>
          </div>
        </div>
      </div>

      {/* Floating bottom toolbar — visible only while user is scrolling within the writing area */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-3 py-2 shadow-lg backdrop-blur-xl transition-all duration-200",
          showFloatingToolbar
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
        aria-hidden={!showFloatingToolbar}
      >
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
          <BlockInsertButtons onInsert={(type) => handleInsertBlock(type)} />
        </div>
      </div>
    </div>
  );
}
