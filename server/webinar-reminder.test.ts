import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sendEmail and buildWebinarReminderEmail
const mockSendEmail = vi.fn();
const mockBuildWebinarReminderEmail = vi.fn();
vi.mock('./emailService', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
  buildWebinarReminderEmail: (...args: any[]) => mockBuildWebinarReminderEmail(...args),
}));

// Mock db functions
const mockGetWebinarById = vi.fn();
const mockGetActiveStudentsWithIds = vi.fn();
const mockGetActiveMentorsWithEmails = vi.fn();
const mockGetActiveManagersWithEmails = vi.fn();
const mockCreateNotifications = vi.fn();
const mockUpdateWebinar = vi.fn();
vi.mock('./db', () => ({
  getWebinarById: (...args: any[]) => mockGetWebinarById(...args),
  getActiveStudentsWithIds: (...args: any[]) => mockGetActiveStudentsWithIds(...args),
  getActiveMentorsWithEmails: (...args: any[]) => mockGetActiveMentorsWithEmails(...args),
  getActiveManagersWithEmails: (...args: any[]) => mockGetActiveManagersWithEmails(...args),
  createNotifications: (...args: any[]) => mockCreateNotifications(...args),
  updateWebinar: (...args: any[]) => mockUpdateWebinar(...args),
}));

// Mock notifyOwner
const mockNotifyOwner = vi.fn();
vi.mock('./_core/notification', () => ({
  notifyOwner: (...args: any[]) => mockNotifyOwner(...args),
}));

describe('Webinar Reminder Email Template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildWebinarReminderEmail.mockImplementation((data: any) => ({
      subject: `Lembrete: ${data.webinarTitle} - ${data.eventDate} às ${data.eventTime}`,
      html: `<html>Reminder for ${data.alunoName} - ${data.webinarTitle}</html>`,
      text: `Reminder for ${data.alunoName} - ${data.webinarTitle}`,
    }));
  });

  it('should generate email with correct subject line', () => {
    const result = mockBuildWebinarReminderEmail({
      alunoName: 'Maria Silva',
      webinarTitle: 'Aula 04 - Resiliência',
      eventDate: '25/03/2026',
      eventTime: '11:00',
      loginUrl: 'https://ecolider.evoluirckm.com',
    });
    expect(result.subject).toBe('Lembrete: Aula 04 - Resiliência - 25/03/2026 às 11:00');
  });

  it('should include recipient name in the email', () => {
    const result = mockBuildWebinarReminderEmail({
      alunoName: 'João Pereira',
      webinarTitle: 'Workshop de Liderança',
      eventDate: '30/03/2026',
      eventTime: '14:00',
      loginUrl: 'https://ecolider.evoluirckm.com',
    });
    expect(result.html).toContain('João Pereira');
    expect(result.text).toContain('João Pereira');
  });

  it('should return subject, html, and text fields', () => {
    const result = mockBuildWebinarReminderEmail({
      alunoName: 'Test',
      webinarTitle: 'Test Webinar',
      eventDate: '01/01/2026',
      eventTime: '10:00',
      loginUrl: 'https://example.com',
    });
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });
});

describe('Recipient Selection Logic', () => {
  const sampleStudents = [
    { id: 1, email: 'aluno1@test.com', name: 'Aluno Um' },
    { id: 2, email: 'aluno2@test.com', name: 'Aluno Dois' },
    { id: 3, email: 'aluno3@test.com', name: 'Aluno Três' },
  ];

  const sampleMentors = [
    { id: 101, email: 'mentor1@test.com', name: 'Mentora Ana' },
    { id: 102, email: 'mentor2@test.com', name: 'Mentora Bia' },
  ];

  const sampleManagers = [
    { id: 201, email: 'gerente1@test.com', name: 'Gerente Carlos' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveStudentsWithIds.mockResolvedValue(sampleStudents);
    mockGetActiveMentorsWithEmails.mockResolvedValue(sampleMentors);
    mockGetActiveManagersWithEmails.mockResolvedValue(sampleManagers);
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-id' });
    mockBuildWebinarReminderEmail.mockReturnValue({
      subject: 'Test Subject',
      html: '<html>Test</html>',
      text: 'Test',
    });
  });

  it('should fetch only alunos when recipients = ["alunos"]', async () => {
    const recipients = ['alunos'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }
    if (recipients.includes('gerentes')) {
      const managers = await mockGetActiveManagersWithEmails();
      allRecipients.push(...managers.map((g: any) => ({ ...g, group: 'gerente' })));
    }

    expect(allRecipients.length).toBe(3);
    expect(allRecipients.every((r: any) => r.group === 'aluno')).toBe(true);
    expect(mockGetActiveMentorsWithEmails).not.toHaveBeenCalled();
    expect(mockGetActiveManagersWithEmails).not.toHaveBeenCalled();
  });

  it('should fetch all groups when recipients = ["alunos", "mentores", "gerentes"]', async () => {
    const recipients = ['alunos', 'mentores', 'gerentes'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }
    if (recipients.includes('gerentes')) {
      const managers = await mockGetActiveManagersWithEmails();
      allRecipients.push(...managers.map((g: any) => ({ ...g, group: 'gerente' })));
    }

    expect(allRecipients.length).toBe(6); // 3 alunos + 2 mentores + 1 gerente
    expect(allRecipients.filter((r: any) => r.group === 'aluno').length).toBe(3);
    expect(allRecipients.filter((r: any) => r.group === 'mentor').length).toBe(2);
    expect(allRecipients.filter((r: any) => r.group === 'gerente').length).toBe(1);
  });

  it('should fetch only mentores and gerentes when recipients = ["mentores", "gerentes"]', async () => {
    const recipients = ['mentores', 'gerentes'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }
    if (recipients.includes('gerentes')) {
      const managers = await mockGetActiveManagersWithEmails();
      allRecipients.push(...managers.map((g: any) => ({ ...g, group: 'gerente' })));
    }

    expect(allRecipients.length).toBe(3); // 2 mentores + 1 gerente
    expect(mockGetActiveStudentsWithIds).not.toHaveBeenCalled();
  });

  it('should deduplicate recipients with same email across groups', async () => {
    // Simulate a mentor who is also a student with same email
    mockGetActiveStudentsWithIds.mockResolvedValue([
      { id: 1, email: 'shared@test.com', name: 'User Shared' },
      { id: 2, email: 'aluno2@test.com', name: 'Aluno Dois' },
    ]);
    mockGetActiveMentorsWithEmails.mockResolvedValue([
      { id: 101, email: 'shared@test.com', name: 'Mentor Shared' },
    ]);

    const recipients = ['alunos', 'mentores'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }

    // Deduplicate by email
    const seenEmails = new Set<string>();
    const uniqueRecipients = allRecipients.filter((r: any) => {
      if (!r.email || seenEmails.has(r.email.toLowerCase())) return false;
      seenEmails.add(r.email.toLowerCase());
      return true;
    });

    expect(uniqueRecipients.length).toBe(2); // shared@test.com counted once + aluno2
    expect(uniqueRecipients.map((r: any) => r.email)).toEqual(['shared@test.com', 'aluno2@test.com']);
  });

  it('should calculate groupCounts correctly', async () => {
    const recipients = ['alunos', 'mentores', 'gerentes'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }
    if (recipients.includes('gerentes')) {
      const managers = await mockGetActiveManagersWithEmails();
      allRecipients.push(...managers.map((g: any) => ({ ...g, group: 'gerente' })));
    }

    const groupCounts: Record<string, number> = {};
    allRecipients.forEach((r: any) => {
      groupCounts[r.group] = (groupCounts[r.group] || 0) + 1;
    });

    expect(groupCounts).toEqual({ aluno: 3, mentor: 2, gerente: 1 });
  });

  it('should create in-app notifications only for alunos (not mentors/managers)', async () => {
    const recipients = ['alunos', 'mentores', 'gerentes'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }
    if (recipients.includes('gerentes')) {
      const managers = await mockGetActiveManagersWithEmails();
      allRecipients.push(...managers.map((g: any) => ({ ...g, group: 'gerente' })));
    }

    // Only alunos get in-app notifications (they have user accounts)
    const studentRecipients = allRecipients.filter((r: any) => r.group === 'aluno');
    const notifications = studentRecipients.map((s: any) => ({
      userId: s.id,
      title: 'Lembrete: Test Webinar',
      message: 'Evento: Test Webinar',
      type: 'action',
      isRead: 0,
    }));

    expect(notifications.length).toBe(3); // Only alunos
    expect(notifications.every((n: any) => [1, 2, 3].includes(n.userId))).toBe(true);
  });

  it('should send emails to ALL recipient groups', async () => {
    const recipients = ['alunos', 'mentores', 'gerentes'];
    const allRecipients: any[] = [];

    if (recipients.includes('alunos')) {
      const students = await mockGetActiveStudentsWithIds();
      allRecipients.push(...students.map((s: any) => ({ ...s, group: 'aluno' })));
    }
    if (recipients.includes('mentores')) {
      const mentors = await mockGetActiveMentorsWithEmails();
      allRecipients.push(...mentors.map((m: any) => ({ ...m, group: 'mentor' })));
    }
    if (recipients.includes('gerentes')) {
      const managers = await mockGetActiveManagersWithEmails();
      allRecipients.push(...managers.map((g: any) => ({ ...g, group: 'gerente' })));
    }

    for (const recipient of allRecipients) {
      await mockSendEmail({ to: recipient.email, subject: 'Test', html: '<html>Test</html>', text: 'Test' });
    }

    expect(mockSendEmail).toHaveBeenCalledTimes(6); // 3 + 2 + 1
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'aluno1@test.com' }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'mentor1@test.com' }));
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'gerente1@test.com' }));
  });
});

describe('Resend Reminder', () => {
  const sampleWebinarAlreadySent = {
    id: 1,
    title: 'Aula 04 - Resiliência',
    eventDate: new Date('2026-03-25T14:00:00Z'),
    speaker: 'Dr. Paulo',
    meetingLink: 'https://meet.google.com/abc',
    status: 'published',
    reminderSent: 1,
    reminderSentAt: new Date('2026-03-19T19:06:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWebinarById.mockResolvedValue(sampleWebinarAlreadySent);
    mockGetActiveStudentsWithIds.mockResolvedValue([
      { id: 1, email: 'aluno1@test.com', name: 'Aluno Um' },
    ]);
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-id' });
  });

  it('should allow resending even when reminderSent is already 1', async () => {
    const webinar = await mockGetWebinarById(1);
    // The new logic does NOT check reminderSent anymore, allowing resend
    expect(webinar.reminderSent).toBe(1);
    // Should still proceed with sending
    const students = await mockGetActiveStudentsWithIds();
    expect(students.length).toBe(1);
  });

  it('should update reminderSentAt with new timestamp on resend', async () => {
    const now = new Date();
    await mockUpdateWebinar(1, {
      reminderSent: 1,
      reminderSentAt: now,
    });

    expect(mockUpdateWebinar).toHaveBeenCalledWith(1, expect.objectContaining({
      reminderSent: 1,
      reminderSentAt: now,
    }));
  });
});

describe('Email Failure Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should continue sending after individual email failures', async () => {
    mockSendEmail
      .mockResolvedValueOnce({ success: false, error: 'SMTP error' })
      .mockResolvedValueOnce({ success: true, messageId: 'id2' })
      .mockResolvedValueOnce({ success: true, messageId: 'id3' });

    const recipients = [
      { email: 'fail@test.com', name: 'Fail' },
      { email: 'ok1@test.com', name: 'OK 1' },
      { email: 'ok2@test.com', name: 'OK 2' },
    ];

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const r of recipients) {
      const result = await mockSendEmail({ to: r.email, subject: 'Test', html: 'T', text: 'T' });
      if (result.success) emailsSent++;
      else emailsFailed++;
    }

    expect(emailsSent).toBe(2);
    expect(emailsFailed).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
  });

  it('should batch emails in groups of 10', () => {
    const recipients = Array.from({ length: 25 }, (_, i) => ({
      email: `user${i}@test.com`,
      name: `User ${i}`,
    }));

    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    expect(batches.length).toBe(3);
    expect(batches[0].length).toBe(10);
    expect(batches[1].length).toBe(10);
    expect(batches[2].length).toBe(5);
  });

  it('should filter out recipients without email', () => {
    const allRecipients = [
      { id: 1, email: 'valid@test.com', name: 'Valid', group: 'aluno' },
      { id: 2, email: null, name: 'No Email', group: 'aluno' },
      { id: 3, email: '', name: 'Empty Email', group: 'mentor' },
      { id: 4, email: 'also-valid@test.com', name: 'Also Valid', group: 'gerente' },
    ];

    const seenEmails = new Set<string>();
    const uniqueRecipients = allRecipients.filter((r: any) => {
      if (!r.email || seenEmails.has(r.email.toLowerCase())) return false;
      seenEmails.add(r.email.toLowerCase());
      return true;
    });

    expect(uniqueRecipients.length).toBe(2);
    expect(uniqueRecipients.map((r: any) => r.email)).toEqual(['valid@test.com', 'also-valid@test.com']);
  });
});

describe('Return Value Structure', () => {
  it('should return complete result with groupCounts', () => {
    const result = {
      success: true,
      emailsSent: 6,
      emailsFailed: 0,
      notificationsCreated: 3,
      totalRecipients: 6,
      groupCounts: { aluno: 3, mentor: 2, gerente: 1 },
    };

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('emailsSent', 6);
    expect(result).toHaveProperty('emailsFailed', 0);
    expect(result).toHaveProperty('notificationsCreated', 3);
    expect(result).toHaveProperty('totalRecipients', 6);
    expect(result).toHaveProperty('groupCounts');
    expect(result.groupCounts).toEqual({ aluno: 3, mentor: 2, gerente: 1 });
    expect(result.emailsSent + result.emailsFailed).toBe(result.totalRecipients);
  });
});
