import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import Trash from "./Trash";
import { useCompoze } from "@/store/compozeStore";

const initialSongs = useCompoze.getState().songs;
const initialProjects = useCompoze.getState().projects;

beforeEach(() => {
  useCompoze.setState({ songs: initialSongs, projects: initialProjects });
});

describe("Trash page", () => {
  it("shows the empty state when there is nothing in the trash", () => {
    render(<Trash />);
    expect(screen.getByText("Sua lixeira está vazia")).toBeInTheDocument();
  });

  it("lists a soft-deleted song and restores it", () => {
    useCompoze.getState().deleteSong("s1");

    render(<Trash />);
    expect(screen.getByText("Café da madrugada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /restaurar$/i }));

    expect(useCompoze.getState().getSong("s1")?.deletedAt).toBeUndefined();
  });

  it("permanently deletes a song after confirming", async () => {
    useCompoze.getState().deleteSong("s1");

    render(<Trash />);
    fireEvent.click(screen.getByRole("button", { name: /excluir definitivamente/i }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^excluir$/i }));

    expect(useCompoze.getState().getSong("s1")).toBeUndefined();
  });
});
