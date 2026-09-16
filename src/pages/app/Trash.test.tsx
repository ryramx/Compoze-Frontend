import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Song } from "@/types";
import Trash from "./Trash";

// A tela lê do store, e o store agora fala com a API. Aqui o interesse é a
// tela, não a rede: os serviços são mockados e o estado é semeado à mão.
vi.mock("@/services/api/songService", () => ({
  list: vi.fn(async () => []),
  listTrash: vi.fn(async () => []),
  softDelete: vi.fn(async () => undefined),
  restore: vi.fn(async () => ({})),
  permanentDelete: vi.fn(async () => undefined),
  getById: vi.fn(async () => ({})),
}));
vi.mock("@/services/api/folderService", () => ({ list: vi.fn(async () => []) }));
vi.mock("@/services/api/projectService", () => ({ list: vi.fn(async () => []) }));
vi.mock("@/services/api/userService", () => ({ getMany: vi.fn(async () => []) }));

const { useCompoze } = await import("@/store/compozeStore");

const musica: Song = {
  id: "s1",
  title: "Café da madrugada",
  status: "ideia",
  creatorId: "u1",
  collaborators: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  blocks: [],
};

beforeEach(() => {
  useCompoze.setState({
    currentUserId: "u1",
    users: [
      {
        id: "u1",
        name: "Ryan",
        username: "ryan",
        avatar: "",
        bio: "",
        location: { city: "", country: "", lat: 0, lng: 0 },
        followers: 0,
        following: 0,
        authorColor: 1,
      },
    ],
    songs: [structuredClone(musica)],
    projects: [],
    folders: [],
    hidratado: true,
  });
});

describe("tela da Lixeira", () => {
  it("mostra o estado vazio quando não há nada na lixeira", () => {
    render(<Trash />);
    expect(screen.getByText("Sua lixeira está vazia")).toBeInTheDocument();
  });

  it("lista uma música excluída e a restaura", () => {
    useCompoze.getState().deleteSong("s1");

    render(<Trash />);
    expect(screen.getByText("Café da madrugada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /restaurar$/i }));

    expect(useCompoze.getState().getSong("s1")?.deletedAt).toBeUndefined();
  });

  it("exclui definitivamente após confirmar", async () => {
    useCompoze.getState().deleteSong("s1");

    render(<Trash />);
    fireEvent.click(screen.getByRole("button", { name: /excluir definitivamente/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^excluir$/i }));

    expect(useCompoze.getState().getSong("s1")).toBeUndefined();
  });
});
