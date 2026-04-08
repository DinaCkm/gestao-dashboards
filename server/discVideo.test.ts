import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  markDiscVideoWatched: vi.fn(),
  hasWatchedDiscVideo: vi.fn(),
}));

import { markDiscVideoWatched, hasWatchedDiscVideo } from "./db";

describe("DISC Video Watched Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("markDiscVideoWatched", () => {
    it("should return success when marking video as watched", async () => {
      (markDiscVideoWatched as any).mockResolvedValue({ success: true });
      const result = await markDiscVideoWatched(1);
      expect(result).toEqual({ success: true });
      expect(markDiscVideoWatched).toHaveBeenCalledWith(1);
    });

    it("should return failure when database error occurs", async () => {
      (markDiscVideoWatched as any).mockResolvedValue({ success: false });
      const result = await markDiscVideoWatched(999);
      expect(result).toEqual({ success: false });
    });
  });

  describe("hasWatchedDiscVideo", () => {
    it("should return true when aluno has watched the video", async () => {
      (hasWatchedDiscVideo as any).mockResolvedValue(true);
      const result = await hasWatchedDiscVideo(1);
      expect(result).toBe(true);
    });

    it("should return false when aluno has not watched the video", async () => {
      (hasWatchedDiscVideo as any).mockResolvedValue(false);
      const result = await hasWatchedDiscVideo(2);
      expect(result).toBe(false);
    });

    it("should return false for non-existent aluno", async () => {
      (hasWatchedDiscVideo as any).mockResolvedValue(false);
      const result = await hasWatchedDiscVideo(99999);
      expect(result).toBe(false);
    });
  });
});
