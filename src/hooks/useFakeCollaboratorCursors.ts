import { useEffect, useState } from "react";
import type { SongBlock } from "@/types";

export interface FakeCursor {
  userId: string;
  blockId: string;
  pos: number;
}

/**
 * Simulates other collaborators' cursors moving around the document —
 * random positions on a timer. This is NOT real-time collaboration (no
 * WebSocket / CRDT behind it); the name says so explicitly to avoid future
 * confusion with an eventual real implementation.
 */
export function useFakeCollaboratorCursors(
  songId: string | undefined,
  collaboratorIds: string[],
  blocks: SongBlock[] | undefined,
  intervalMs = 2200,
) {
  const [cursors, setCursors] = useState<FakeCursor[]>([]);

  useEffect(() => {
    if (!blocks || blocks.length === 0 || collaboratorIds.length === 0) {
      setCursors([]);
      return;
    }
    const move = () => {
      setCursors(
        collaboratorIds.map((uid) => {
          const block = blocks[Math.floor(Math.random() * blocks.length)];
          return { userId: uid, blockId: block.id, pos: Math.random() };
        }),
      );
    };
    move();
    const t = setInterval(move, intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, collaboratorIds, intervalMs]);

  return cursors;
}
