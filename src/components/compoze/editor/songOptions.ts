import type { SongStatus } from "@/types";

export const statusOptions: { value: SongStatus; label: string }[] = [
  { value: "ideia", label: "Ideia" },
  { value: "escrita", label: "Escrita" },
  { value: "revisao", label: "Revisão" },
  { value: "finalizada", label: "Finalizada" },
  { value: "registrada", label: "Registrada" },
  { value: "gravada", label: "Gravada" },
];

// Standardized musical key options (major + minor)
export const keyOptions: string[] = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb",
  "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dbm", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m", "Gbm",
  "Gm", "G#m", "Abm", "Am", "A#m", "Bbm", "Bm",
];

// Standardized time signature options (andamento / compasso)
export const timeSignatureOptions: string[] = ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8", "5/4", "7/8"];
