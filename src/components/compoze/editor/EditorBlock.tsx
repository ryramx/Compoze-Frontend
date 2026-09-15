import type { SongBlock, User } from "@/types";
import type { FakeCursor } from "@/hooks/useFakeCollaboratorCursors";
import { SectionBlock } from "./SectionBlock";
import { TextBlock } from "./TextBlock";

interface EditorBlockProps {
  block: SongBlock;
  authorColor: number;
  authorName: string;
  isMine: boolean;
  onChange: (text: string) => void;
  onLabel: (label: string) => void;
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

/** Dispatches a song block to the component matching its type. */
export function EditorBlock({ block, onChange, onLabel, ...rest }: EditorBlockProps) {
  if (block.type === "section") {
    return (
      <SectionBlock
        label={block.label ?? ""}
        onLabel={onLabel}
        onRemove={rest.onRemove}
        onFocus={rest.onFocus}
        onBlur={rest.onBlur}
        isFocused={rest.isFocused}
        shouldFocus={rest.shouldFocus}
        onFocusHandled={rest.onFocusHandled}
        onEnter={rest.onEnter}
      />
    );
  }

  return <TextBlock type={block.type} text={block.text} onChange={onChange} {...rest} />;
}
