import type { FiltroBusca } from "@/services/api/songService";

/**
 * Chaves de cache do TanStack Query, centralizadas.
 *
 * Ficam num lugar só porque invalidação depende de as chaves baterem
 * exatamente. Espalhadas pelos componentes, um `["songs"]` num lado e
 * `["song"]` no outro fazem a tela não atualizar depois de salvar — e o erro
 * não aparece como erro, só como dado velho na tela.
 */
export const chaves = {
  songs: {
    todas: ["songs"] as const,
    lista: (filtro: FiltroBusca = {}) => ["songs", "lista", filtro] as const,
    detalhe: (id: string) => ["songs", "detalhe", id] as const,
    lixeira: ["songs", "lixeira"] as const,
  },
  folders: {
    todas: ["folders"] as const,
    lista: ["folders", "lista"] as const,
  },
  projects: {
    todos: ["projects"] as const,
    lista: ["projects", "lista"] as const,
    detalhe: (id: string) => ["projects", "detalhe", id] as const,
  },
} as const;
