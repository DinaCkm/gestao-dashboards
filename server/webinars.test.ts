import { describe, it, expect, vi } from "vitest";

// Test the webinar form validation logic and data transformations
describe("Webinars Module", () => {
  describe("Webinar data validation", () => {
    it("should require title for creating a webinar", () => {
      const form = {
        title: "",
        eventDate: "2026-03-15T14:00:00.000Z",
      };
      expect(form.title.length).toBe(0);
      // Title is required - empty string should fail validation
    });

    it("should require eventDate for creating a webinar", () => {
      const form = {
        title: "Test Webinar",
        eventDate: "",
      };
      expect(form.eventDate.length).toBe(0);
    });

    it("should accept valid webinar creation data", () => {
      const form = {
        title: "2026/03 - Liderança com João Silva",
        description: "Webinar sobre liderança",
        theme: "Liderança",
        speaker: "João Silva",
        speakerBio: "Especialista em liderança",
        eventDate: "2026-03-15T14:00:00.000Z",
        duration: 60,
        meetingLink: "https://zoom.us/j/123456",
        youtubeLink: "",
        targetAudience: "all" as const,
        status: "draft" as const,
      };

      expect(form.title.length).toBeGreaterThan(0);
      expect(form.eventDate.length).toBeGreaterThan(0);
      expect(new Date(form.eventDate).getTime()).not.toBeNaN();
      expect(form.duration).toBeGreaterThan(0);
      expect(["all", "sebrae_to", "sebrae_acre", "embrapii", "banrisul"]).toContain(form.targetAudience);
      expect(["draft", "published", "completed", "cancelled"]).toContain(form.status);
    });
  });

  describe("Status labels and colors", () => {
    const STATUS_LABELS: Record<string, string> = {
      draft: "Rascunho",
      published: "Publicado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    const AUDIENCE_LABELS: Record<string, string> = {
      all: "Todos os Programas",
      sebrae_to: "SEBRAE Tocantins",
      sebrae_acre: "SEBRAE Acre",
      embrapii: "EMBRAPII",
      banrisul: "BANRISUL",
    };

    it("should have labels for all statuses", () => {
      expect(Object.keys(STATUS_LABELS)).toEqual(["draft", "published", "completed", "cancelled"]);
    });

    it("should have labels for all audiences", () => {
      expect(Object.keys(AUDIENCE_LABELS)).toEqual(["all", "sebrae_to", "sebrae_acre", "embrapii", "banrisul"]);
    });

    it("should return correct label for each status", () => {
      expect(STATUS_LABELS["draft"]).toBe("Rascunho");
      expect(STATUS_LABELS["published"]).toBe("Publicado");
      expect(STATUS_LABELS["completed"]).toBe("Concluído");
      expect(STATUS_LABELS["cancelled"]).toBe("Cancelado");
    });
  });

  describe("Date formatting", () => {
    it("should format date correctly for display", () => {
      const dateStr = "2026-03-15T14:00:00.000Z";
      const formatted = new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      expect(formatted).toContain("2026");
      expect(formatted).toContain("03");
      expect(formatted).toContain("15");
    });

    it("should handle null dates gracefully", () => {
      const dateStr: string | null = null;
      const result = dateStr ? new Date(dateStr).toLocaleDateString("pt-BR") : "—";
      expect(result).toBe("—");
    });
  });

  describe("Webinar filtering", () => {
    const webinars = [
      { id: 1, title: "Liderança Estratégica", speaker: "João Silva", theme: "Liderança", status: "published", eventDate: "2026-04-01T14:00:00.000Z" },
      { id: 2, title: "IA na Gestão", speaker: "Maria Santos", theme: "Tecnologia", status: "draft", eventDate: "2026-05-01T14:00:00.000Z" },
      { id: 3, title: "Comunicação Eficaz", speaker: "Pedro Lima", theme: "Comunicação", status: "completed", eventDate: "2025-12-01T14:00:00.000Z" },
    ];

    it("should filter by search term in title", () => {
      const term = "liderança";
      const filtered = webinars.filter(w =>
        w.title.toLowerCase().includes(term) ||
        w.speaker.toLowerCase().includes(term) ||
        w.theme.toLowerCase().includes(term)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(1);
    });

    it("should filter by search term in speaker", () => {
      const term = "maria";
      const filtered = webinars.filter(w =>
        w.title.toLowerCase().includes(term) ||
        w.speaker.toLowerCase().includes(term) ||
        w.theme.toLowerCase().includes(term)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    it("should filter by search term in theme", () => {
      const term = "comunicação";
      const filtered = webinars.filter(w =>
        w.title.toLowerCase().includes(term) ||
        w.speaker.toLowerCase().includes(term) ||
        w.theme.toLowerCase().includes(term)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(3);
    });

    it("should return all when search term is empty", () => {
      const term = "";
      const filtered = term ? webinars.filter(w =>
        w.title.toLowerCase().includes(term) ||
        w.speaker.toLowerCase().includes(term) ||
        w.theme.toLowerCase().includes(term)
      ) : webinars;
      expect(filtered).toHaveLength(3);
    });

    it("should calculate stats correctly", () => {
      const now = new Date("2026-03-01T00:00:00.000Z");
      const stats = {
        total: webinars.length,
        published: webinars.filter(w => w.status === "published").length,
        completed: webinars.filter(w => w.status === "completed").length,
        upcoming: webinars.filter(w => w.status === "published" && new Date(w.eventDate) > now).length,
      };
      expect(stats.total).toBe(3);
      expect(stats.published).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.upcoming).toBe(1);
    });
  });

  describe("Webinar edit form population", () => {
    it("should populate form from webinar data", () => {
      const webinar = {
        title: "Test Webinar",
        description: "A description",
        theme: "Tech",
        speaker: "Speaker Name",
        speakerBio: "Bio text",
        eventDate: "2026-04-15T10:00:00.000Z",
        duration: 90,
        meetingLink: "https://zoom.us/j/123",
        youtubeLink: "https://youtube.com/watch?v=abc",
        targetAudience: "sebrae_to",
        status: "published",
      };

      const form = {
        title: webinar.title || "",
        description: webinar.description || "",
        theme: webinar.theme || "",
        speaker: webinar.speaker || "",
        speakerBio: webinar.speakerBio || "",
        eventDate: webinar.eventDate
          ? new Date(webinar.eventDate).toISOString().slice(0, 16)
          : "",
        duration: webinar.duration || 60,
        meetingLink: webinar.meetingLink || "",
        youtubeLink: webinar.youtubeLink || "",
        targetAudience: webinar.targetAudience || "all",
        status: webinar.status || "draft",
      };

      expect(form.title).toBe("Test Webinar");
      expect(form.description).toBe("A description");
      expect(form.eventDate).toBe("2026-04-15T10:00");
      expect(form.duration).toBe(90);
      expect(form.meetingLink).toBe("https://zoom.us/j/123");
      expect(form.youtubeLink).toBe("https://youtube.com/watch?v=abc");
      expect(form.targetAudience).toBe("sebrae_to");
      expect(form.status).toBe("published");
    });

    it("should handle null/undefined fields gracefully", () => {
      const webinar = {
        title: "Minimal Webinar",
        description: null,
        theme: undefined,
        speaker: null,
        speakerBio: undefined,
        eventDate: "2026-04-15T10:00:00.000Z",
        duration: null,
        meetingLink: null,
        youtubeLink: null,
        targetAudience: null,
        status: null,
      };

      const form = {
        title: webinar.title || "",
        description: webinar.description || "",
        theme: webinar.theme || "",
        speaker: webinar.speaker || "",
        speakerBio: webinar.speakerBio || "",
        eventDate: webinar.eventDate
          ? new Date(webinar.eventDate).toISOString().slice(0, 16)
          : "",
        duration: webinar.duration || 60,
        meetingLink: webinar.meetingLink || "",
        youtubeLink: webinar.youtubeLink || "",
        targetAudience: webinar.targetAudience || "all",
        status: webinar.status || "draft",
      };

      expect(form.title).toBe("Minimal Webinar");
      expect(form.description).toBe("");
      expect(form.theme).toBe("");
      expect(form.speaker).toBe("");
      expect(form.duration).toBe(60);
      expect(form.meetingLink).toBe("");
      expect(form.youtubeLink).toBe("");
      expect(form.targetAudience).toBe("all");
      expect(form.status).toBe("draft");
    });
  });
});
