import { create } from "zustand";

import {
  conversations as initialConversations,
  feed as initialFeed,
  follows as initialFollows,
} from "@/data/mockData";
import type {
  Conversation,
  FeedItem,
  Folder,
  Follow,
  Project,
  ProjectStyle,
  ProjectType,
  Song,
  SongBlock,
  User,
} from "@/types";
import * as folderApi from "@/services/api/folderService";
import * as projectApi from "@/services/api/projectService";
import * as songApi from "@/services/api/songService";
import * as userApi from "@/services/api/userService";
import * as feedService from "@/services/mock/feedService";
import * as messageService from "@/services/mock/messageService";
import * as songService from "@/services/mock/songService";
import * as userService from "@/services/mock/userService";

/**
 * Estado da aplicação.
 *
 * Música, pasta, projeto e usuário vêm da API e persistem. Feed, mensagens e
 * seguidores continuam vindo de `mockData`: são Fase 2 e 3 do PRD e ainda não
 * existem no backend. A separação está explícita nos imports acima — `*Api`
 * versus `*Service` — para que ninguém precise adivinhar o que é real.
 *
 * ## Por que um store, e não `useQuery` em cada tela
 *
 * `getUser` aparece em quase todo componente (avatar de colaborador, autoria de
 * bloco, busca global) e precisa responder de forma síncrona durante a
 * renderização. Um cache compartilhado resolve isso melhor do que uma query por
 * componente. As chamadas HTTP ficam em `src/services/api/`, separadas, então
 * migrar telas específicas para `useQuery` depois continua possível sem
 * reescrever a camada de acesso.
 */
interface CompozeState {
  currentUserId: string;
  users: User[];
  songs: Song[];
  folders: Folder[];
  projects: Project[];

  // Ainda sem backend (PRD Fases 2 e 3).
  conversations: Conversation[];
  feed: FeedItem[];
  follows: Follow[];
  followingIds: string[];

  hidratado: boolean;
  carregando: boolean;
  erro: string | null;

  hydrate: (currentUserId: string) => Promise<void>;
  limpar: () => void;
  /** Busca a música completa, com blocos, que a listagem não traz. */
  loadSong: (id: string) => Promise<void>;

  getUser: (id: string) => User | undefined;
  getSong: (id: string) => Song | undefined;
  getProject: (id: string) => Project | undefined;

  createSong: (input: {
    title: string;
    folderId?: string;
    projectId?: string;
  }) => Promise<string>;
  createProject: (input: {
    name: string;
    type: ProjectType;
    style: ProjectStyle;
    description?: string;
    releaseDate?: string;
    fundingGoal?: number;
    estimatedCost?: number;
  }) => Promise<string>;
  createFolder: (name: string, parentId?: string) => Promise<string>;

  updateSong: (id: string, patch: Partial<Song>) => void;
  updateBlock: (songId: string, blockId: string, patch: Partial<SongBlock>) => void;
  addBlock: (songId: string, block: Omit<SongBlock, "id">) => void;
  insertBlock: (
    songId: string,
    block: Omit<SongBlock, "id">,
    options?: { afterId?: string; beforeId?: string },
  ) => Promise<string>;
  removeBlock: (songId: string, blockId: string) => void;
  inviteCollaborator: (songId: string, userId: string, percentage?: number) => void;
  setContribution: (songId: string, userId: string, percentage: number) => void;
  toggleSongHidden: (songId: string) => void;
  deleteSong: (songId: string) => void;
  restoreSong: (songId: string) => void;
  permanentlyDeleteSong: (songId: string) => void;
  /**
   * Mantida por compatibilidade com a tela de Lixeira, mas não apaga nada: a
   * exclusão definitiva é do job do servidor (RN08). Aqui só recarrega.
   */
  purgeExpiredTrash: () => void;

  updateCurrentUser: (patch: Partial<Pick<User, "name" | "bio" | "instagram">>) => void;
  toggleFollow: (userId: string) => void;
  sendMessage: (toUserId: string, content: string) => void;
  postFeed: (content: string) => void;
}

/**
 * Temporizadores por bloco, para adiar a gravação do texto.
 *
 * O editor chama `updateBlock` a cada tecla. Sem isto, cada letra digitada
 * viraria uma requisição. O estado local muda na hora — a digitação não trava —
 * e a gravação acontece quando a pessoa para de escrever.
 */
const ATRASO_DE_GRAVACAO = 600;
const temporizadores = new Map<string, ReturnType<typeof setTimeout>>();

function agendarGravacao(chave: string, gravar: () => Promise<unknown>): void {
  const anterior = temporizadores.get(chave);
  if (anterior) clearTimeout(anterior);
  temporizadores.set(
    chave,
    setTimeout(() => {
      temporizadores.delete(chave);
      void gravar().catch(() => {
        // Falha de gravação não derruba a digitação em curso. O estado volta ao
        // valor do servidor na próxima leitura da música.
      });
    }, ATRASO_DE_GRAVACAO),
  );
}

export const useCompoze = create<CompozeState>((set, get) => ({
  currentUserId: "",
  users: [],
  songs: [],
  folders: [],
  projects: [],

  conversations: initialConversations,
  feed: initialFeed,
  follows: initialFollows,
  followingIds: [],

  hidratado: false,
  carregando: false,
  erro: null,

  // ------------------------------------------------------------- carga inicial

  hydrate: async (currentUserId) => {
    set({ carregando: true, erro: null, currentUserId });
    try {
      // Ativas e lixeira juntas: as telas filtram por `deletedAt`, e buscar as
      // duas de uma vez mantém `listActive`/`listTrashed` funcionando como antes.
      const [ativas, lixeira, folders, projects] = await Promise.all([
        songApi.list(),
        songApi.listTrash(),
        folderApi.list(),
        projectApi.list(),
      ]);
      const songs = [...ativas, ...lixeira];

      // Resolve numa só requisição todas as pessoas citadas nas obras.
      const ids = new Set<string>([currentUserId]);
      for (const s of songs) {
        ids.add(s.creatorId);
        for (const c of s.collaborators) ids.add(c.userId);
      }

      set({
        songs,
        folders,
        projects,
        users: await userApi.getMany([...ids]),
        followingIds: userService.getFollowingIds(initialFollows, currentUserId),
        hidratado: true,
        carregando: false,
      });
    } catch {
      set({
        carregando: false,
        erro: "Não foi possível carregar seus dados. Verifique se a API está no ar.",
      });
    }
  },

  limpar: () =>
    set({
      currentUserId: "",
      users: [],
      songs: [],
      folders: [],
      projects: [],
      hidratado: false,
      erro: null,
    }),

  loadSong: async (id) => {
    const completa = await songApi.getById(id);
    set({ songs: get().songs.map((s) => (s.id === id ? completa : s)) });

    // Traz quem ainda não estiver em cache (colaborador adicionado noutra sessão).
    const conhecidos = new Set(get().users.map((u) => u.id));
    const faltando = [completa.creatorId, ...completa.collaborators.map((c) => c.userId)].filter(
      (uid) => !conhecidos.has(uid),
    );
    if (faltando.length > 0) {
      set({ users: [...get().users, ...(await userApi.getMany(faltando))] });
    }
  },

  // ------------------------------------------------------------------ leitura

  getUser: (id) => get().users.find((u) => u.id === id),
  getSong: (id) => get().songs.find((s) => s.id === id),
  getProject: (id) => get().projects.find((p) => p.id === id),

  // ------------------------------------------------------------------ criação

  createSong: async ({ title, folderId, projectId }) => {
    const nova = await songApi.create({ title, folderId });
    set({ songs: [nova, ...get().songs] });

    if (projectId) {
      const projeto = await projectApi.addSong(projectId, nova.id);
      set({ projects: get().projects.map((p) => (p.id === projeto.id ? projeto : p)) });
    }
    return nova.id;
  },

  createFolder: async (name, parentId) => {
    const pasta = await folderApi.create(name, parentId);
    set({ folders: [...get().folders, pasta] });
    return pasta.id;
  },

  createProject: async (input) => {
    const projeto = await projectApi.create(input);
    set({ projects: [projeto, ...get().projects] });
    return projeto.id;
  },

  // ------------------------------------------------------------------ música

  updateSong: (id, patch) => {
    // Otimista: a tela reflete a mudança na hora e a gravação é adiada. Vale
    // porque o editor salva a cada tecla no título e nos metadados.
    set({ songs: get().songs.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
    agendarGravacao(`song:${id}`, () => songApi.update(id, patch));
  },

  toggleSongHidden: (songId) => {
    const musica = get().getSong(songId);
    if (!musica) return;
    get().updateSong(songId, { hidden: !musica.hidden });
  },

  deleteSong: (songId) => {
    set({
      songs: get().songs.map((s) =>
        s.id === songId ? { ...s, deletedAt: new Date().toISOString() } : s,
      ),
    });
    void songApi.softDelete(songId).catch(() => void get().hydrate(get().currentUserId));
  },

  restoreSong: (songId) => {
    set({
      songs: get().songs.map((s) => (s.id === songId ? { ...s, deletedAt: undefined } : s)),
    });
    void songApi.restore(songId).catch(() => void get().hydrate(get().currentUserId));
  },

  permanentlyDeleteSong: (songId) => {
    set({ songs: get().songs.filter((s) => s.id !== songId) });
    void songApi.permanentDelete(songId).catch(() => void get().hydrate(get().currentUserId));
  },

  purgeExpiredTrash: () => {
    // O expurgo é do servidor (RN08). Aqui só relemos, para que um item que o
    // job já apagou desapareça da tela.
    if (get().hidratado) void get().hydrate(get().currentUserId);
  },

  // ------------------------------------------------------------------ blocos

  updateBlock: (songId, blockId, patch) => {
    set({
      songs: get().songs.map((s) =>
        s.id === songId
          ? { ...s, blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }
          : s,
      ),
    });
    agendarGravacao(`block:${blockId}`, () => songApi.updateBlock(songId, blockId, patch));
  },

  addBlock: (songId, block) => {
    void (async () => {
      await songApi.addBlock(songId, { type: block.type, text: block.text, label: block.label });
      await get().loadSong(songId);
    })();
  },

  insertBlock: async (songId, block, options) => {
    const musica = get().getSong(songId);
    // Converte "depois do bloco X" / "antes do bloco X" na posição numérica que
    // a API espera (decisão D04: ordem é campo explícito, não ordem do array).
    let position: number | undefined;
    if (musica) {
      if (options?.afterId) {
        const i = musica.blocks.findIndex((b) => b.id === options.afterId);
        if (i >= 0) position = i + 1;
      } else if (options?.beforeId) {
        const i = musica.blocks.findIndex((b) => b.id === options.beforeId);
        if (i >= 0) position = i;
      }
    }

    await songApi.addBlock(songId, {
      type: block.type,
      text: block.text,
      label: block.label,
      position,
    });
    await get().loadSong(songId);

    const atualizada = get().getSong(songId);
    const criado =
      position === undefined
        ? atualizada?.blocks[atualizada.blocks.length - 1]
        : atualizada?.blocks[position];
    return criado?.id ?? "";
  },

  removeBlock: (songId, blockId) => {
    set({
      songs: get().songs.map((s) =>
        s.id === songId ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) } : s,
      ),
    });
    void songApi
      .removeBlock(songId, blockId)
      .catch(() => void get().loadSong(songId));
  },

  // ----------------------------------------------------------- colaboradores

  inviteCollaborator: (songId, userId) => {
    void (async () => {
      await songApi.inviteCollaborator(songId, userId);
      await get().loadSong(songId);
    })();
  },

  setContribution: (songId, userId, percentage) => {
    const musica = get().getSong(songId);
    if (!musica) return;

    const contribuicoes = musica.collaborators.map((c) =>
      c.userId === userId ? { ...c, percentage } : c,
    );
    set({
      songs: get().songs.map((s) =>
        s.id === songId ? { ...s, collaborators: contribuicoes } : s,
      ),
    });

    // Sem confirmar: enquanto a divisão está em negociação, a soma não precisa
    // fechar 100 (RN05). Confirmar é ato separado.
    agendarGravacao(`contrib:${songId}`, () =>
      songApi.setContributions(songId, contribuicoes, false),
    );
  },

  // ------------------------------------------------------------------ perfil

  updateCurrentUser: (patch) => {
    const id = get().currentUserId;
    set({ users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
    agendarGravacao("me", () => userApi.updateMe(patch));
  },

  // ------------------------------------------- ainda sem backend (Fases 2 e 3)

  toggleFollow: (userId) => {
    const follows = userService.toggleFollow(get().follows, get().currentUserId, userId);
    set({ follows, followingIds: userService.getFollowingIds(follows, get().currentUserId) });
  },

  sendMessage: (toUserId, content) =>
    set({
      conversations: messageService.send(
        get().conversations,
        get().currentUserId,
        toUserId,
        content,
      ),
    }),

  postFeed: (content) => set({ feed: feedService.post(get().feed, get().currentUserId, content) }),
}));

// Reexportado para as telas que já o usavam a partir daqui.
export { songService };
