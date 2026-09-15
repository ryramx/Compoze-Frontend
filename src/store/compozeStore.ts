import { create } from "zustand";
import {
  CURRENT_USER_ID,
  conversations as initialConversations,
  feed as initialFeed,
  folders as initialFolders,
  follows as initialFollows,
  projects as initialProjects,
  songs as initialSongs,
  users as initialUsers,
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
import * as songService from "@/services/mock/songService";
import * as projectService from "@/services/mock/projectService";
import * as folderService from "@/services/mock/folderService";
import * as userService from "@/services/mock/userService";
import * as messageService from "@/services/mock/messageService";
import * as feedService from "@/services/mock/feedService";

interface CompozeState {
  currentUserId: string;
  users: User[];
  songs: Song[];
  folders: Folder[];
  projects: Project[];
  conversations: Conversation[];
  feed: FeedItem[];
  follows: Follow[];
  followingIds: string[];

  // actions
  getUser: (id: string) => User | undefined;
  getSong: (id: string) => Song | undefined;
  getProject: (id: string) => Project | undefined;
  createSong: (input: { title: string; folderId?: string; projectId?: string }) => string;
  createProject: (input: {
    name: string;
    type: ProjectType;
    style: ProjectStyle;
    description?: string;
    releaseDate?: string;
    fundingGoal?: number;
    estimatedCost?: number;
  }) => string;
  updateSong: (id: string, patch: Partial<Song>) => void;
  updateBlock: (songId: string, blockId: string, patch: Partial<SongBlock>) => void;
  addBlock: (songId: string, block: Omit<SongBlock, "id">) => void;
  insertBlock: (
    songId: string,
    block: Omit<SongBlock, "id">,
    options?: { afterId?: string; beforeId?: string },
  ) => string;
  removeBlock: (songId: string, blockId: string) => void;
  inviteCollaborator: (songId: string, userId: string, percentage?: number) => void;
  setContribution: (songId: string, userId: string, percentage: number) => void;
  createFolder: (name: string, parentId?: string) => string;
  toggleFollow: (userId: string) => void;
  sendMessage: (toUserId: string, content: string) => void;
  postFeed: (content: string) => void;
  toggleSongHidden: (songId: string) => void;
  deleteSong: (songId: string) => void;
  restoreSong: (songId: string) => void;
  permanentlyDeleteSong: (songId: string) => void;
  purgeExpiredTrash: () => void;
  updateCurrentUser: (patch: Partial<Pick<User, "name" | "bio" | "instagram">>) => void;
}

// Roda a "varredura automatizada" de expiração da lixeira (RN07/RN08) sobre
// um snapshot de songs/projects, devolvendo o resultado já expurgado.
function withPurgedTrash(songs: Song[], projects: Project[]) {
  return songService.purgeExpired(songs, projects);
}

const initialPurge = withPurgedTrash(initialSongs, initialProjects);

export const useCompoze = create<CompozeState>((set, get) => ({
  currentUserId: CURRENT_USER_ID,
  users: initialUsers,
  songs: initialPurge.songs,
  folders: initialFolders,
  projects: initialPurge.projects,
  conversations: initialConversations,
  feed: initialFeed,
  follows: initialFollows,
  // Campo plano (não um getter) de propósito: o Zustand reconstrói o objeto
  // de estado a cada set() via Object.assign, o que "congelaria" um getter
  // de acessor no valor lido na primeira mutação. Em vez disso, toda ação
  // que muda `follows` também recalcula `followingIds` no mesmo set(),
  // mantendo os dois sempre consistentes com uma única fonte (`follows`).
  followingIds: userService.getFollowingIds(initialFollows, CURRENT_USER_ID),

  getUser: (id) => userService.getById(get().users, id),
  getSong: (id) => songService.getById(get().songs, id),
  getProject: (id) => projectService.getById(get().projects, id),

  createSong: ({ title, folderId, projectId }) => {
    const { songs, newId } = songService.create(get().songs, {
      title,
      folderId,
      projectId,
      authorId: get().currentUserId,
    });
    set({ songs });
    if (projectId) {
      set({ projects: projectService.addSong(get().projects, projectId, newId) });
    }
    return newId;
  },

  updateSong: (id, patch) => set({ songs: songService.update(get().songs, id, patch) }),

  updateBlock: (songId, blockId, patch) =>
    set({ songs: songService.updateBlock(get().songs, songId, blockId, patch) }),

  addBlock: (songId, block) => set({ songs: songService.addBlock(get().songs, songId, block) }),

  insertBlock: (songId, block, options) => {
    const { songs, newId } = songService.insertBlock(get().songs, songId, block, options);
    set({ songs });
    return newId;
  },

  removeBlock: (songId, blockId) =>
    set({ songs: songService.removeBlock(get().songs, songId, blockId) }),

  inviteCollaborator: (songId, userId, percentage = 0) =>
    set({ songs: songService.inviteCollaborator(get().songs, songId, userId, percentage) }),

  setContribution: (songId, userId, percentage) =>
    set({ songs: songService.setContribution(get().songs, songId, userId, percentage) }),

  createFolder: (name, parentId) => {
    const { folders, newId } = folderService.create(get().folders, name, get().currentUserId, parentId);
    set({ folders });
    return newId;
  },

  toggleFollow: (userId) => {
    const follows = userService.toggleFollow(get().follows, get().currentUserId, userId);
    set({ follows, followingIds: userService.getFollowingIds(follows, get().currentUserId) });
  },

  sendMessage: (toUserId, content) =>
    set({
      conversations: messageService.send(get().conversations, get().currentUserId, toUserId, content),
    }),

  postFeed: (content) => set({ feed: feedService.post(get().feed, get().currentUserId, content) }),

  toggleSongHidden: (songId) => set({ songs: songService.toggleHidden(get().songs, songId) }),

  deleteSong: (songId) => set({ songs: songService.softDelete(get().songs, songId) }),

  restoreSong: (songId) => set({ songs: songService.restore(get().songs, songId) }),

  permanentlyDeleteSong: (songId) => {
    const { songs, projects } = songService.permanentDelete(get().songs, get().projects, songId);
    set({ songs, projects });
  },

  purgeExpiredTrash: () => {
    const { songs, projects } = withPurgedTrash(get().songs, get().projects);
    set({ songs, projects });
  },

  updateCurrentUser: (patch) =>
    set({ users: userService.update(get().users, get().currentUserId, patch) }),

  createProject: ({ name, type, style, description, releaseDate, fundingGoal, estimatedCost }) => {
    const { projects, newId } = projectService.create(get().projects, {
      name,
      type,
      style,
      ownerId: get().currentUserId,
      description,
      releaseDate,
      fundingGoal,
      estimatedCost,
    });
    set({ projects });
    return newId;
  },
}));
