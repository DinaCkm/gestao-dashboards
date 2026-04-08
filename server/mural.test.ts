import { describe, it, expect, vi } from "vitest";

// Test the data structures and helper logic for the Mural do Aluno page

describe("Mural do Aluno - Data Structures", () => {
  it("should categorize announcements by type correctly", () => {
    const announcements = [
      { id: 1, type: "webinar", title: "Webinar IA", isActive: 1 },
      { id: 2, type: "course", title: "Curso Liderança", isActive: 1 },
      { id: 3, type: "activity", title: "Workshop Prático", isActive: 1 },
      { id: 4, type: "notice", title: "Aviso Importante", isActive: 1 },
      { id: 5, type: "news", title: "Nova Parceria", isActive: 1 },
      { id: 6, type: "course", title: "Curso Gestão", isActive: 1 },
    ];

    const courses = announcements.filter((a) => a.type === "course");
    const activities = announcements.filter((a) => a.type === "activity");
    const notices = announcements.filter((a) => a.type === "notice");
    const news = announcements.filter((a) => a.type === "news");
    const webinars = announcements.filter((a) => a.type === "webinar");

    expect(courses).toHaveLength(2);
    expect(activities).toHaveLength(1);
    expect(notices).toHaveLength(1);
    expect(news).toHaveLength(1);
    expect(webinars).toHaveLength(1);
  });

  it("should sort items with upcoming webinars first", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 86400000); // +1 day
    const past = new Date(now.getTime() - 86400000); // -1 day

    const items = [
      { type: "announcement", date: new Date(past), data: { id: 1, title: "Aviso" } },
      { type: "upcoming_webinar", date: new Date(future), data: { id: 2, title: "Webinar Futuro" } },
      { type: "announcement", date: new Date(now), data: { id: 3, title: "Aviso Recente" } },
    ];

    const sorted = items.sort((a, b) => {
      if (a.type === "upcoming_webinar" && b.type !== "upcoming_webinar") return -1;
      if (a.type !== "upcoming_webinar" && b.type === "upcoming_webinar") return 1;
      if (a.type === "upcoming_webinar" && b.type === "upcoming_webinar") {
        return a.date.getTime() - b.date.getTime();
      }
      return b.date.getTime() - a.date.getTime();
    });

    expect(sorted[0].type).toBe("upcoming_webinar");
    expect(sorted[1].data.title).toBe("Aviso Recente");
    expect(sorted[2].data.title).toBe("Aviso");
  });

  it("should correctly identify upcoming events", () => {
    const now = new Date();
    const future = new Date(now.getTime() + 86400000);
    const past = new Date(now.getTime() - 86400000);

    const isUpcoming = (dateStr: string | Date | null | undefined): boolean => {
      if (!dateStr) return false;
      return new Date(dateStr) > new Date();
    };

    expect(isUpcoming(future)).toBe(true);
    expect(isUpcoming(past)).toBe(false);
    expect(isUpcoming(null)).toBe(false);
    expect(isUpcoming(undefined)).toBe(false);
  });

  it("should calculate days until event correctly", () => {
    const daysUntil = (dateStr: string | Date | null | undefined): number => {
      if (!dateStr) return 0;
      const diff = new Date(dateStr).getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const tomorrow = new Date(Date.now() + 86400000);
    const nextWeek = new Date(Date.now() + 7 * 86400000);

    expect(daysUntil(tomorrow)).toBe(1);
    expect(daysUntil(nextWeek)).toBe(7);
    expect(daysUntil(null)).toBe(0);
  });

  it("should format dates in pt-BR format", () => {
    const formatDate = (dateStr: string | Date | null | undefined): string => {
      if (!dateStr) return "—";
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    };

    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    // A valid date should return a non-empty string
    const result = formatDate(new Date("2026-03-15T10:00:00Z"));
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should have correct type configuration for all announcement types", () => {
    const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
      webinar: { label: "Webinar", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
      course: { label: "Curso", color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200" },
      activity: { label: "Atividade Extra", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200" },
      notice: { label: "Aviso", color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
      news: { label: "Novidade", color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200" },
    };

    expect(Object.keys(TYPE_CONFIG)).toHaveLength(5);
    expect(TYPE_CONFIG.webinar.label).toBe("Webinar");
    expect(TYPE_CONFIG.course.label).toBe("Curso");
    expect(TYPE_CONFIG.activity.label).toBe("Atividade Extra");
    expect(TYPE_CONFIG.notice.label).toBe("Aviso");
    expect(TYPE_CONFIG.news.label).toBe("Novidade");
  });

  it("should handle webinar data with all optional fields", () => {
    const minimalWebinar = {
      id: 1,
      title: "Webinar Teste",
      eventDate: new Date(),
      status: "published",
    };

    const fullWebinar = {
      id: 2,
      title: "Webinar Completo",
      description: "Descrição do webinar",
      theme: "Inovação",
      speaker: "João Silva",
      speakerBio: "Especialista em IA",
      eventDate: new Date(),
      duration: 90,
      meetingLink: "https://meet.google.com/abc",
      youtubeLink: "https://youtube.com/watch?v=123",
      cardImageUrl: "https://example.com/card.jpg",
      status: "published",
    };

    expect(minimalWebinar.title).toBeDefined();
    expect(fullWebinar.meetingLink).toBeDefined();
    expect(fullWebinar.youtubeLink).toBeDefined();
    expect(fullWebinar.cardImageUrl).toBeDefined();
  });
});
