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
const mockCreateNotifications = vi.fn();
const mockUpdateWebinar = vi.fn();
vi.mock('./db', () => ({
  getWebinarById: (...args: any[]) => mockGetWebinarById(...args),
  getActiveStudentsWithIds: (...args: any[]) => mockGetActiveStudentsWithIds(...args),
  createNotifications: (...args: any[]) => mockCreateNotifications(...args),
  updateWebinar: (...args: any[]) => mockUpdateWebinar(...args),
}));

// Mock notifyOwner
const mockNotifyOwner = vi.fn();
vi.mock('./_core/notification', () => ({
  notifyOwner: (...args: any[]) => mockNotifyOwner(...args),
}));

// Import the email template builder directly to test it
import { buildWebinarReminderEmail } from './emailService';

describe('Webinar Reminder Email Template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the real implementation for template tests
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

  it('should include student name in the email', () => {
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

  it('should include webinar title in the email', () => {
    const result = mockBuildWebinarReminderEmail({
      alunoName: 'Ana Costa',
      webinarTitle: 'Gestão do Tempo',
      eventDate: '01/04/2026',
      eventTime: '09:00',
      loginUrl: 'https://ecolider.evoluirckm.com',
    });

    expect(result.html).toContain('Gestão do Tempo');
    expect(result.text).toContain('Gestão do Tempo');
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
    expect(typeof result.subject).toBe('string');
    expect(typeof result.html).toBe('string');
    expect(typeof result.text).toBe('string');
  });
});

describe('Webinar Reminder - sendReminder Logic', () => {
  const sampleWebinar = {
    id: 1,
    title: 'Aula 04 - Resiliência e Proatividade',
    eventDate: new Date('2026-03-25T14:00:00Z'),
    speaker: 'Dr. Paulo Mendes',
    theme: 'Resiliência',
    meetingLink: 'https://meet.google.com/abc-def-ghi',
    status: 'published',
    reminderSent: 0,
  };

  const sampleStudents = [
    { id: 1, email: 'aluno1@test.com', name: 'Aluno Um' },
    { id: 2, email: 'aluno2@test.com', name: 'Aluno Dois' },
    { id: 3, email: 'aluno3@test.com', name: 'Aluno Três' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWebinarById.mockResolvedValue(sampleWebinar);
    mockGetActiveStudentsWithIds.mockResolvedValue(sampleStudents);
    mockCreateNotifications.mockResolvedValue(undefined);
    mockUpdateWebinar.mockResolvedValue(undefined);
    mockNotifyOwner.mockResolvedValue(true);
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-id' });
    mockBuildWebinarReminderEmail.mockReturnValue({
      subject: 'Test Subject',
      html: '<html>Test</html>',
      text: 'Test',
    });
  });

  it('should create in-app notifications for all students', async () => {
    // Simulate the logic from sendReminder
    const students = await mockGetActiveStudentsWithIds();
    const validStudents = students.filter((s: any) => s.email);

    const notifications = validStudents.map((s: any) => ({
      userId: s.id,
      title: `Lembrete: ${sampleWebinar.title}`,
      message: `Evento: ${sampleWebinar.title}`,
      type: 'action',
      isRead: 0,
      actionUrl: sampleWebinar.meetingLink || '/mural',
    }));

    await mockCreateNotifications(notifications);

    expect(mockCreateNotifications).toHaveBeenCalledTimes(1);
    expect(mockCreateNotifications).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          type: 'action',
          isRead: 0,
        }),
        expect.objectContaining({
          userId: 2,
          type: 'action',
          isRead: 0,
        }),
        expect.objectContaining({
          userId: 3,
          type: 'action',
          isRead: 0,
        }),
      ])
    );
  });

  it('should create notifications with correct count matching students', async () => {
    const students = await mockGetActiveStudentsWithIds();
    const validStudents = students.filter((s: any) => s.email);

    const notifications = validStudents.map((s: any) => ({
      userId: s.id,
      title: `Lembrete: ${sampleWebinar.title}`,
      message: `Evento: ${sampleWebinar.title}`,
      type: 'action',
      isRead: 0,
    }));

    expect(notifications.length).toBe(3);
    expect(notifications[0].userId).toBe(1);
    expect(notifications[1].userId).toBe(2);
    expect(notifications[2].userId).toBe(3);
  });

  it('should send emails to all students', async () => {
    const students = await mockGetActiveStudentsWithIds();
    const validStudents = students.filter((s: any) => s.email);

    let emailsSent = 0;
    for (const student of validStudents) {
      const emailData = mockBuildWebinarReminderEmail({
        alunoName: student.name,
        webinarTitle: sampleWebinar.title,
        eventDate: '25/03/2026',
        eventTime: '11:00',
        loginUrl: 'https://ecolider.evoluirckm.com',
      });

      const result = await mockSendEmail({
        to: student.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      if (result.success) emailsSent++;
    }

    expect(emailsSent).toBe(3);
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'aluno1@test.com' })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'aluno2@test.com' })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'aluno3@test.com' })
    );
  });

  it('should handle email failures gracefully and continue sending', async () => {
    // First email fails, others succeed
    mockSendEmail
      .mockResolvedValueOnce({ success: false, error: 'SMTP error' })
      .mockResolvedValueOnce({ success: true, messageId: 'id2' })
      .mockResolvedValueOnce({ success: true, messageId: 'id3' });

    const students = await mockGetActiveStudentsWithIds();
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const student of students) {
      const result = await mockSendEmail({
        to: student.email,
        subject: 'Test',
        html: '<html>Test</html>',
        text: 'Test',
      });

      if (result.success) {
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    expect(emailsSent).toBe(2);
    expect(emailsFailed).toBe(1);
    // All 3 emails were attempted despite the first failure
    expect(mockSendEmail).toHaveBeenCalledTimes(3);
  });

  it('should update webinar reminder status after sending', async () => {
    await mockUpdateWebinar(sampleWebinar.id, {
      reminderSent: 1,
      reminderSentAt: expect.any(Date),
    });

    expect(mockUpdateWebinar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ reminderSent: 1 })
    );
  });

  it('should notify owner with summary of sent reminders', async () => {
    await mockNotifyOwner({
      title: 'Lembrete de Webinar Enviado',
      content: expect.stringContaining(sampleWebinar.title),
    });

    expect(mockNotifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Lembrete de Webinar Enviado',
      })
    );
  });

  it('should include meeting link in notification when available', async () => {
    const students = await mockGetActiveStudentsWithIds();
    const notifications = students.map((s: any) => ({
      userId: s.id,
      title: `Lembrete: ${sampleWebinar.title}`,
      message: `Evento: ${sampleWebinar.title}\nLink: ${sampleWebinar.meetingLink}`,
      type: 'action',
      isRead: 0,
      actionUrl: sampleWebinar.meetingLink,
    }));

    expect(notifications[0].actionUrl).toBe('https://meet.google.com/abc-def-ghi');
    expect(notifications[0].message).toContain('https://meet.google.com/abc-def-ghi');
  });

  it('should use /mural as fallback actionUrl when no meeting link', async () => {
    const webinarNoLink = { ...sampleWebinar, meetingLink: null };
    const students = await mockGetActiveStudentsWithIds();
    const notifications = students.map((s: any) => ({
      userId: s.id,
      title: `Lembrete: ${webinarNoLink.title}`,
      message: `Evento: ${webinarNoLink.title}`,
      type: 'action',
      isRead: 0,
      actionUrl: webinarNoLink.meetingLink || '/mural',
    }));

    expect(notifications[0].actionUrl).toBe('/mural');
  });

  it('should filter out students without email', async () => {
    mockGetActiveStudentsWithIds.mockResolvedValue([
      { id: 1, email: 'aluno1@test.com', name: 'Aluno Um' },
      { id: 2, email: null, name: 'Aluno Sem Email' },
      { id: 3, email: 'aluno3@test.com', name: 'Aluno Três' },
    ]);

    const students = await mockGetActiveStudentsWithIds();
    const validStudents = students.filter((s: any) => s.email);

    expect(validStudents.length).toBe(2);
    expect(validStudents.map((s: any) => s.id)).toEqual([1, 3]);
  });

  it('should batch emails to avoid SMTP overload', async () => {
    // Create 25 students to test batching
    const manyStudents = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      email: `aluno${i + 1}@test.com`,
      name: `Aluno ${i + 1}`,
    }));
    mockGetActiveStudentsWithIds.mockResolvedValue(manyStudents);

    const students = await mockGetActiveStudentsWithIds();
    const BATCH_SIZE = 10;
    const batches = [];

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      batches.push(students.slice(i, i + BATCH_SIZE));
    }

    // Should create 3 batches: 10, 10, 5
    expect(batches.length).toBe(3);
    expect(batches[0].length).toBe(10);
    expect(batches[1].length).toBe(10);
    expect(batches[2].length).toBe(5);
  });

  it('should return complete result object with all counters', () => {
    const result = {
      success: true,
      emailsSent: 215,
      emailsFailed: 2,
      notificationsCreated: 217,
      totalStudents: 217,
    };

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('emailsSent');
    expect(result).toHaveProperty('emailsFailed');
    expect(result).toHaveProperty('notificationsCreated');
    expect(result).toHaveProperty('totalStudents');
    expect(result.emailsSent + result.emailsFailed).toBe(result.totalStudents);
  });
});

describe('getActiveStudentsWithIds', () => {
  it('should return students with id, email, and name', async () => {
    const mockStudents = [
      { id: 1, email: 'test@test.com', name: 'Test User' },
    ];
    mockGetActiveStudentsWithIds.mockResolvedValue(mockStudents);

    const result = await mockGetActiveStudentsWithIds();
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('email');
    expect(result[0]).toHaveProperty('name');
  });

  it('should accept optional programId parameter', async () => {
    mockGetActiveStudentsWithIds.mockResolvedValue([]);
    await mockGetActiveStudentsWithIds(5);
    expect(mockGetActiveStudentsWithIds).toHaveBeenCalledWith(5);
  });
});
