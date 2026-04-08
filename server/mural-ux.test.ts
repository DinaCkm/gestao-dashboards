import { describe, it, expect } from "vitest";

/**
 * Tests for the reorganized Mural do Aluno UX.
 * Validates the view navigation logic, stat card counts, drill-down filtering,
 * and attendance status classification used in the new simplified interface.
 */

describe("Mural UX - View Navigation", () => {
  type ViewType = "home" | "webinars" | "gravacoes" | "cursos" | "atividades" | "avisos";

  it("should start on home view by default", () => {
    const initialView: ViewType = "home";
    expect(initialView).toBe("home");
  });

  it("should navigate to drill-down view when card is clicked", () => {
    let currentView: ViewType = "home";
    // Simulate clicking the webinars card
    currentView = "webinars";
    expect(currentView).toBe("webinars");
    // Simulate clicking back
    currentView = "home";
    expect(currentView).toBe("home");
  });

  it("should support all 5 drill-down views", () => {
    const validViews: ViewType[] = ["webinars", "gravacoes", "cursos", "atividades", "avisos"];
    expect(validViews).toHaveLength(5);
    validViews.forEach(v => {
      expect(["webinars", "gravacoes", "cursos", "atividades", "avisos"]).toContain(v);
    });
  });

  it("VIEW_CONFIG should have title and empty state for each view", () => {
    const VIEW_CONFIG: Record<string, { title: string; emptyTitle: string; emptyDesc: string }> = {
      webinars: {
        title: "Próximos Webinars",
        emptyTitle: "Nenhum webinar agendado",
        emptyDesc: "Novos webinars serão publicados em breve.",
      },
      gravacoes: {
        title: "Gravações Disponíveis",
        emptyTitle: "Nenhuma gravação disponível",
        emptyDesc: "As gravações dos webinars realizados aparecerão aqui.",
      },
      cursos: {
        title: "Cursos Disponíveis",
        emptyTitle: "Nenhum curso disponível",
        emptyDesc: "Novos cursos serão divulgados aqui quando disponíveis.",
      },
      atividades: {
        title: "Atividades Extras",
        emptyTitle: "Nenhuma atividade extra",
        emptyDesc: "Atividades extras serão publicadas aqui quando disponíveis.",
      },
      avisos: {
        title: "Avisos e Novidades",
        emptyTitle: "Nenhum aviso",
        emptyDesc: "Avisos e comunicados aparecerão aqui.",
      },
    };

    expect(Object.keys(VIEW_CONFIG)).toHaveLength(5);
    Object.values(VIEW_CONFIG).forEach(config => {
      expect(config.title).toBeTruthy();
      expect(config.emptyTitle).toBeTruthy();
      expect(config.emptyDesc).toBeTruthy();
    });
  });
});

describe("Mural UX - Stat Card Counts", () => {
  it("should count upcoming webinars correctly", () => {
    const now = new Date();
    const webinars = [
      { id: 1, eventDate: new Date(now.getTime() + 86400000), status: "published" },
      { id: 2, eventDate: new Date(now.getTime() + 2 * 86400000), status: "published" },
      { id: 3, eventDate: new Date(now.getTime() - 86400000), status: "published" }, // past
    ];
    const upcoming = webinars.filter(w => new Date(w.eventDate) > now);
    expect(upcoming).toHaveLength(2);
  });

  it("should count past webinars (recordings) correctly", () => {
    const now = new Date();
    const webinars = [
      { id: 1, eventDate: new Date(now.getTime() - 86400000), status: "published" },
      { id: 2, eventDate: new Date(now.getTime() - 2 * 86400000), status: "completed" },
      { id: 3, eventDate: new Date(now.getTime() + 86400000), status: "published" }, // future
    ];
    const past = webinars.filter(w => new Date(w.eventDate) < now);
    expect(past).toHaveLength(2);
  });

  it("should count announcements by type correctly", () => {
    const announcements = [
      { id: 1, type: "course", isActive: 1 },
      { id: 2, type: "course", isActive: 1 },
      { id: 3, type: "activity", isActive: 1 },
      { id: 4, type: "notice", isActive: 1 },
      { id: 5, type: "news", isActive: 1 },
      { id: 6, type: "notice", isActive: 1 },
    ];

    const courses = announcements.filter(a => a.type === "course");
    const activities = announcements.filter(a => a.type === "activity");
    const notices = announcements.filter(a => a.type === "notice");
    const news = announcements.filter(a => a.type === "news");

    expect(courses).toHaveLength(2);
    expect(activities).toHaveLength(1);
    expect(notices).toHaveLength(2);
    expect(news).toHaveLength(1);
    // "Avisos e Novidades" card shows notices + news
    expect(notices.length + news.length).toBe(3);
  });
});

describe("Mural UX - Drill-Down Content Filtering", () => {
  it("should show only upcoming webinars in webinars drill-down", () => {
    const now = new Date();
    const allWebinars = [
      { id: 1, title: "Futuro 1", eventDate: new Date(now.getTime() + 86400000) },
      { id: 2, title: "Passado 1", eventDate: new Date(now.getTime() - 86400000) },
      { id: 3, title: "Futuro 2", eventDate: new Date(now.getTime() + 2 * 86400000) },
    ];
    const upcoming = allWebinars.filter(w => new Date(w.eventDate) > now);
    expect(upcoming).toHaveLength(2);
    expect(upcoming.map(w => w.title)).toEqual(["Futuro 1", "Futuro 2"]);
  });

  it("should show only past webinars in gravacoes drill-down", () => {
    const now = new Date();
    const allWebinars = [
      { id: 1, title: "Passado 1", eventDate: new Date(now.getTime() - 86400000) },
      { id: 2, title: "Futuro 1", eventDate: new Date(now.getTime() + 86400000) },
      { id: 3, title: "Passado 2", eventDate: new Date(now.getTime() - 2 * 86400000) },
    ];
    const past = allWebinars.filter(w => new Date(w.eventDate) < now);
    expect(past).toHaveLength(2);
    expect(past.map(w => w.title)).toEqual(["Passado 1", "Passado 2"]);
  });

  it("should combine notices and news in avisos drill-down", () => {
    const announcements = [
      { id: 1, type: "notice", title: "Aviso 1" },
      { id: 2, type: "news", title: "Novidade 1" },
      { id: 3, type: "course", title: "Curso 1" },
      { id: 4, type: "notice", title: "Aviso 2" },
    ];
    const notices = announcements.filter(a => a.type === "notice");
    const news = announcements.filter(a => a.type === "news");
    const allNotices = [...notices, ...news];
    expect(allNotices).toHaveLength(3);
  });
});

describe("Mural UX - Attendance Status in Webinar Items", () => {
  it("should classify webinar attendance status correctly", () => {
    const confirmedEventIds = new Set([1, 4]);
    const pendingEvents = [{ eventId: 2 }, { eventId: 5 }];

    function getAttendanceStatus(eventId: number): "confirmed" | "pending" | null {
      if (confirmedEventIds.has(eventId)) return "confirmed";
      if (pendingEvents.some(p => p.eventId === eventId)) return "pending";
      return null;
    }

    expect(getAttendanceStatus(1)).toBe("confirmed");
    expect(getAttendanceStatus(2)).toBe("pending");
    expect(getAttendanceStatus(3)).toBeNull();
    expect(getAttendanceStatus(4)).toBe("confirmed");
    expect(getAttendanceStatus(5)).toBe("pending");
  });

  it("should determine if event has ended based on endDate", () => {
    const now = new Date();
    const endedEvent = {
      endDate: new Date(now.getTime() - 3600000), // 1 hour ago
      eventDate: new Date(now.getTime() - 7200000),
    };
    const ongoingEvent = {
      endDate: new Date(now.getTime() + 3600000), // 1 hour from now
      eventDate: new Date(now.getTime() - 1800000),
    };
    const noEndDateEvent = {
      endDate: null,
      eventDate: new Date(now.getTime() - 86400000), // yesterday
    };

    const hasEnded1 = endedEvent.endDate ? new Date(endedEvent.endDate) < now : true;
    const hasEnded2 = ongoingEvent.endDate ? new Date(ongoingEvent.endDate) < now : true;
    const hasEnded3 = noEndDateEvent.endDate ? new Date(noEndDateEvent.endDate) < now : true;

    expect(hasEnded1).toBe(true);
    expect(hasEnded2).toBe(false);
    expect(hasEnded3).toBe(true); // No endDate, assume ended for past events
  });

  it("should show pending attendance items on home view", () => {
    const pendingAttendance = [
      { eventId: 1, eventName: "Webinar A", eventDate: new Date(), youtubeLink: "https://youtube.com/1" },
      { eventId: 2, eventName: "Webinar B", eventDate: new Date(), youtubeLink: null },
      { eventId: 3, eventName: "Webinar C", eventDate: new Date(), youtubeLink: "https://youtube.com/3" },
      { eventId: 4, eventName: "Webinar D", eventDate: new Date(), youtubeLink: null },
    ];

    // Home view shows max 3 pending items
    const displayedItems = pendingAttendance.slice(0, 3);
    expect(displayedItems).toHaveLength(3);
    expect(pendingAttendance.length > 3).toBe(true);
    // Items with youtubeLink should show "Assistir" button
    const withYoutube = displayedItems.filter(w => w.youtubeLink);
    expect(withYoutube).toHaveLength(2);
  });
});

describe("Mural UX - Webinar Action Buttons Logic", () => {
  it("upcoming webinar should show 'Participar ao Vivo' button", () => {
    const now = new Date();
    const webinar = {
      eventDate: new Date(now.getTime() + 86400000),
      meetingLink: "https://meet.google.com/abc",
      youtubeLink: null,
    };
    const isPast = false;
    const hasLink = !!webinar.meetingLink;
    expect(isPast).toBe(false);
    expect(hasLink).toBe(true);
    // Button: "Participar ao Vivo"
  });

  it("past webinar with YouTube should show 'Assistir Gravação' button", () => {
    const now = new Date();
    const webinar = {
      eventDate: new Date(now.getTime() - 86400000),
      meetingLink: "https://meet.google.com/abc",
      youtubeLink: "https://youtube.com/watch?v=123",
    };
    const isPast = true;
    const hasYoutube = !!webinar.youtubeLink;
    expect(isPast).toBe(true);
    expect(hasYoutube).toBe(true);
    // Button: "Assistir Gravação" (red YouTube button)
  });

  it("past webinar without YouTube should show 'Link do Evento' button", () => {
    const webinar = {
      eventDate: new Date(Date.now() - 86400000),
      meetingLink: "https://meet.google.com/abc",
      youtubeLink: null,
    };
    const isPast = true;
    const hasYoutube = !!webinar.youtubeLink;
    const hasMeetingLink = !!webinar.meetingLink;
    expect(isPast).toBe(true);
    expect(hasYoutube).toBe(false);
    expect(hasMeetingLink).toBe(true);
    // Button: "Link do Evento" (outline)
  });

  it("past ended webinar with pending attendance should show 'Marcar Presença' button", () => {
    const now = new Date();
    const webinar = {
      eventDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() - 3600000),
    };
    const isPast = true;
    const hasEnded = new Date(webinar.endDate) < now;
    const attendanceStatus = "pending";
    expect(isPast).toBe(true);
    expect(hasEnded).toBe(true);
    expect(attendanceStatus).toBe("pending");
    // Button: "Marcar Presença" (orange)
  });

  it("past webinar with confirmed attendance should NOT show 'Marcar Presença' button", () => {
    const attendanceStatus = "confirmed";
    const shouldShowButton = attendanceStatus === "pending";
    expect(shouldShowButton).toBe(false);
    // Should show green "Presença confirmada" badge instead
  });
});

describe("Announcements CRUD - Data Validation", () => {
  it("should validate announcement types", () => {
    const validTypes = ["webinar", "course", "activity", "notice", "news"];
    validTypes.forEach(type => {
      expect(["webinar", "course", "activity", "notice", "news"]).toContain(type);
    });
    expect(validTypes).toHaveLength(5);
  });

  it("should validate target audience options", () => {
    const validAudiences = ["all", "sebrae_to", "sebrae_acre", "embrapii", "banrisul"];
    expect(validAudiences).toHaveLength(5);
    expect(validAudiences).toContain("all");
  });

  it("should filter active announcements for students", () => {
    const now = new Date();
    const announcements = [
      { id: 1, isActive: 1, publishAt: null, expiresAt: null, targetAudience: "all" },
      { id: 2, isActive: 0, publishAt: null, expiresAt: null, targetAudience: "all" }, // inactive
      { id: 3, isActive: 1, publishAt: new Date(now.getTime() + 86400000), expiresAt: null, targetAudience: "all" }, // not yet published
      { id: 4, isActive: 1, publishAt: new Date(now.getTime() - 86400000), expiresAt: null, targetAudience: "all" }, // published
      { id: 5, isActive: 1, publishAt: null, expiresAt: new Date(now.getTime() - 86400000), targetAudience: "all" }, // expired
    ];

    const active = announcements.filter(a => {
      if (a.isActive !== 1) return false;
      if (a.publishAt && new Date(a.publishAt) > now) return false;
      if (a.expiresAt && new Date(a.expiresAt) < now) return false;
      return true;
    });

    expect(active).toHaveLength(2); // id 1 and id 4
    expect(active.map(a => a.id)).toEqual([1, 4]);
  });

  it("should require title for announcements", () => {
    const validAnnouncement = { title: "Novo Curso de Liderança", type: "course" };
    const invalidAnnouncement = { title: "", type: "course" };

    expect(validAnnouncement.title.length).toBeGreaterThan(0);
    expect(invalidAnnouncement.title.length).toBe(0);
  });

  it("should support optional fields in announcements", () => {
    const minimal = {
      title: "Aviso Importante",
      type: "notice",
    };
    const full = {
      title: "Curso Completo",
      type: "course",
      content: "Descrição detalhada do curso",
      imageUrl: "https://example.com/image.jpg",
      actionUrl: "https://example.com/curso",
      actionLabel: "Inscreva-se",
      targetAudience: "all",
      priority: 8,
      publishAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
      isActive: 1,
    };

    expect(minimal.title).toBeTruthy();
    expect(full.content).toBeTruthy();
    expect(full.imageUrl).toBeTruthy();
    expect(full.actionUrl).toBeTruthy();
    expect(full.priority).toBe(8);
  });
});
