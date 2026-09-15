import { beforeEach, describe, expect, it } from "vitest";
import { useCompoze } from "./compozeStore";

const initialSongs = useCompoze.getState().songs;
const initialProjects = useCompoze.getState().projects;
const initialFollows = useCompoze.getState().follows;
const initialFollowingIds = useCompoze.getState().followingIds;

beforeEach(() => {
  useCompoze.setState({
    songs: initialSongs,
    projects: initialProjects,
    follows: initialFollows,
    followingIds: initialFollowingIds,
  });
});

describe("compozeStore", () => {
  it("createSong adds a new song owned by the current user", () => {
    const { createSong, getSong, currentUserId } = useCompoze.getState();
    const id = createSong({ title: "Minha nova ideia" });
    const song = getSong(id);
    expect(song).toBeDefined();
    expect(song!.title).toBe("Minha nova ideia");
    expect(song!.creatorId).toBe(currentUserId);
    expect(song!.status).toBe("ideia");
  });

  it("deleteSong soft-deletes (sets deletedAt) instead of removing the song", () => {
    const { deleteSong, getSong } = useCompoze.getState();
    deleteSong("s1");
    const song = getSong("s1");
    expect(song).toBeDefined();
    expect(song!.deletedAt).toBeTruthy();
  });

  it("restoreSong clears deletedAt and preserves original folderId/projectId", () => {
    const { deleteSong, restoreSong, getSong } = useCompoze.getState();
    const before = getSong("s1")!;
    deleteSong("s1");
    restoreSong("s1");
    const after = getSong("s1");
    expect(after!.deletedAt).toBeUndefined();
    expect(after!.folderId).toBe(before.folderId);
    expect(after!.projectId).toBe(before.projectId);
  });

  it("permanentlyDeleteSong removes the song and cleans up project.songIds", () => {
    const { deleteSong, permanentlyDeleteSong, getSong, getProject } = useCompoze.getState();
    deleteSong("s1"); // s1 belongs to project p1
    permanentlyDeleteSong("s1");
    expect(getSong("s1")).toBeUndefined();
    expect(getProject("p1")!.songIds).not.toContain("s1");
  });

  it("setContribution updates a collaborator's percentage", () => {
    const { setContribution, getSong } = useCompoze.getState();
    setContribution("s1", "u1", 75);
    const song = getSong("s1")!;
    expect(song.collaborators.find((c) => c.userId === "u1")?.percentage).toBe(75);
  });

  it("toggleFollow adds then removes a follow edge, keeping followingIds in sync", () => {
    const { toggleFollow, currentUserId } = useCompoze.getState();
    expect(useCompoze.getState().followingIds).not.toContain("u4");

    toggleFollow("u4");
    expect(useCompoze.getState().followingIds).toContain("u4");
    expect(useCompoze.getState().follows).toContainEqual({ followerId: currentUserId, followingId: "u4" });

    toggleFollow("u4");
    expect(useCompoze.getState().followingIds).not.toContain("u4");
  });
});
