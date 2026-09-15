import { useEffect, useRef } from "react";
import { Music2, StickyNote, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import type { FakeCursor } from "@/hooks/useFakeCollaboratorCursors";

type TextBlockType = "chord-line" | "lyric-line" | "note";

const icons: Record<TextBlockType, typeof Music2> = {
  "chord-line": Music2,
  "lyric-line": Type,
  note: StickyNote,
};

const placeholders: Record<TextBlockType, string> = {
  "chord-line": "Am   F   C   G",
  "lyric-line": "Letra…",
  note: "Anotação ou ideia",
};

interface TextBlockProps {
  type: TextBlockType;
  text: string;
  authorColor: number;
  authorName: string;
  isMine: boolean;
  onChange: (text: string) => void;
  onRemove: () => void;
  cursors: FakeCursor[];
  getUser: (id: string) => User | undefined;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  shouldFocus?: boolean;
  onFocusHandled?: () => void;
  onEnter?: () => void;
}

/**
 * Renders chord/lyric/note blocks — the three block types share almost
 * identical structure (a single auto-resizing Textarea + fake-cursor
 * overlay), differing only in placeholder/styling, so they're one
 * parametrized component instead of three near-duplicates. `ChordBlock`,
 * `LyricBlock` and `NoteBlock` below are thin named wrappers so the
 * component names from the design system (doc de UI, seção 39) exist as a
 * public API without duplicating logic.
 */
export function TextBlock({
  type,
  text,
  authorColor,
  authorName,
  isMine,
  onChange,
  onRemove,
  cursors,
  getUser,
  onFocus,
  onBlur,
  isFocused,
  shouldFocus,
  onFocusHandled,
  onEnter,
}: TextBlockProps) {
  const Icon = icons[type];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (shouldFocus) {
      textareaRef.current?.focus();
      onFocusHandled?.();
    }
  }, [shouldFocus, onFocusHandled]);

  // Auto-resize textarea to fit content (handles wrapping for long lines)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  return (
    <div className="group relative">
      <div className="flex items-start gap-2">
        {/* Decorative type icon — hidden on mobile */}
        <div
          className={cn(
            "mt-1 hidden h-6 w-6 place-items-center rounded-md md:grid",
            `bg-author-${authorColor}/15 text-author-${authorColor}`,
          )}
        >
          <Icon className="h-3 w-3" />
        </div>
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={(e) => {
              // Enter inserts a new lyric line below for lyric/note (no Shift)
              if (e.key === "Enter" && !e.shiftKey && (type === "lyric-line" || type === "note")) {
                e.preventDefault();
                onEnter?.();
              }
            }}
            rows={1}
            placeholder={placeholders[type]}
            className={cn(
              "min-h-[1.75rem] resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent px-2 py-1 text-base leading-snug focus-visible:ring-1 focus-visible:ring-offset-0",
              type === "chord-line" && "chord text-primary font-semibold",
              type === "note" && "italic text-muted-foreground",
              type === "lyric-line" && "pl-8",
              `author-${authorColor}`,
              "rounded-md",
            )}
          />
          {cursors.map((c, i) => {
            const u = getUser(c.userId);
            if (!u) return null;
            return (
              <div
                key={i}
                className="live-cursor"
                data-name={u.name.split(" ")[0]}
                style={
                  {
                    left: `${c.pos * 80}%`,
                    top: 0,
                    height: "100%",
                    width: 2,
                    background: `hsl(var(--author-${u.authorColor}))`,
                    "--cursor-color": `hsl(var(--author-${u.authorColor}))`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
        {isFocused && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 h-6 w-6"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            title="Remover"
            aria-label="Remover bloco"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {!isMine && (
        <div className="ml-2 -mt-1 text-[10px] text-muted-foreground md:ml-8">
          contribuição de{" "}
          <span className={cn(`text-author-${authorColor}`, "font-semibold")}>{authorName}</span>
        </div>
      )}
    </div>
  );
}

type NamedBlockProps = Omit<TextBlockProps, "type">;

export function ChordBlock(props: NamedBlockProps) {
  return <TextBlock type="chord-line" {...props} />;
}

export function LyricBlock(props: NamedBlockProps) {
  return <TextBlock type="lyric-line" {...props} />;
}

export function NoteBlock(props: NamedBlockProps) {
  return <TextBlock type="note" {...props} />;
}
