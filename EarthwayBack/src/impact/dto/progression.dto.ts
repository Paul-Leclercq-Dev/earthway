export interface ProgressionDto {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXP: number | null;
  progress: number; // percentage (0-100)
  leveledUp?: boolean;
  oldLevel?: number;
}
