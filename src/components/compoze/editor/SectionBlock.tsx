import { useEffect, useRef } from "react";
import { Hash, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SectionBlock({
  label,
  onLabel,
  onRemove,
  onFocus,
  onBlur,
  isFocused,
  shouldFocus,
  onFocusHandled,
  onEnter,
}: {
  label: string;
  onLabel: (label: string) => void;
  onRemove: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  shouldFocus?: boolean;
  onFocusHandled?: () => void;
  onEnter?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
      onFocusHandled?.();
    }
  }, [shouldFocus, onFocusHandled]);

  return (
    <div className="group relative mt-3 flex items-center gap-3 first:mt-1">
      <Hash className="h-3 w-3 text-primary" />
      <Input
        ref={inputRef}
        value={label}
        onChange={(e) => onLabel(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        placeholder="Nome da seção"
        className="h-7 max-w-xs border-0 bg-transparent px-1 text-xs uppercase tracking-[0.25em] text-primary focus-visible:ring-1"
      />
      <span className="h-px flex-1 bg-border/60" />
      {isFocused && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          title="Remover"
          aria-label="Remover seção"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
