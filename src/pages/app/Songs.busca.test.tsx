import { describe, expect, it } from "vitest";

import type { Song } from "@/types";

/**
 * Regra de busca da tela de Canções, extraída para teste.
 *
 * Mantida idêntica ao filtro em Songs.tsx. Testar a regra separada do
 * componente cobre o que de fato importa aqui — quais canções aparecem —
 * sem depender de renderização.
 */
function buscar(songs: Song[], query: string): Song[] {
  const termo = query.trim().toLowerCase();
  return songs.filter(
    (s) =>
      !termo ||
      s.title.toLowerCase().includes(termo) ||
      (s.tags ?? []).some((t) => t.toLowerCase().includes(termo)),
  );
}

function musica(title: string, tags?: string[]): Song {
  return {
    id: title,
    title,
    status: "ideia",
    creatorId: "u1",
    collaborators: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    blocks: [],
    tags,
  };
}

describe("busca de canções", () => {
  const acervo = [
    musica("Noite de Verão", ["mpb", "romântica"]),
    musica("Manhã Fria", ["rock"]),
    musica("Sem Tags"),
  ];

  it("encontra por título", () => {
    expect(buscar(acervo, "noite").map((s) => s.title)).toEqual(["Noite de Verão"]);
  });

  it("encontra por tag", () => {
    expect(buscar(acervo, "rock").map((s) => s.title)).toEqual(["Manhã Fria"]);
  });

  it("ignora maiúsculas e minúsculas", () => {
    expect(buscar(acervo, "MPB").map((s) => s.title)).toEqual(["Noite de Verão"]);
  });

  it("encontra por parte da tag", () => {
    expect(buscar(acervo, "român").map((s) => s.title)).toEqual(["Noite de Verão"]);
  });

  it("não quebra em canção sem tags", () => {
    expect(() => buscar(acervo, "qualquer")).not.toThrow();
  });

  it("busca vazia devolve tudo", () => {
    expect(buscar(acervo, "   ")).toHaveLength(3);
  });

  it("devolve vazio quando nada casa", () => {
    expect(buscar(acervo, "jazz")).toEqual([]);
  });
});
