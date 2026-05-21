import { google, calendar_v3 } from 'googleapis';

// ID do calendário central
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'relacionamento@ckmtalents.net';

// Credenciais da Service Account (via variável de ambiente)
// Usa Domain-Wide Delegation com google.auth.JWT (disponível via googleapis)
function getAuth() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurado');
  }
  const credentials = JSON.parse(credentialsJson);
  // Impersona o dono do calendário para que os convites sejam enviados em nome dele
  const impersonateUser = process.env.GOOGLE_CALENDAR_IMPERSONATE || CALENDAR_ID;
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
    subject: impersonateUser,
  });
}

// Fuso horário padrão (Brasília)
const TIMEZONE = 'America/Sao_Paulo';

export interface CalendarEventInput {
  title: string;
  description?: string;
  startDateTime: string; // ISO string
  endDateTime: string;   // ISO string
  attendees?: { email: string; displayName?: string }[];
  meetLink?: boolean; // se true, gera Google Meet automaticamente
  location?: string;
}

export interface CalendarEventResult {
  googleEventId: string;
  htmlLink: string;
  meetLink?: string;
}

/**
 * Cria um evento no Google Calendar
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarEventResult | null> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event: calendar_v3.Schema$Event = {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: input.startDateTime,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: TIMEZONE,
      },
      attendees: input.attendees?.map((a) => ({
        email: a.email,
        displayName: a.displayName,
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 30 },       // 30 min antes
        ],
      },
      ...(input.meetLink
        ? {
            conferenceData: {
              createRequest: {
                requestId: `ckm-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }
        : {}),
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      conferenceDataVersion: input.meetLink ? 1 : 0,
      sendUpdates: 'all', // envia e-mail de convite para todos os participantes
    });

    const created = response.data;
    const meetLink =
      created.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;

    return {
      googleEventId: created.id!,
      htmlLink: created.htmlLink!,
      meetLink,
    };
  } catch (error) {
    console.error('[GoogleCalendar] Erro ao criar evento:', error);
    return null;
  }
}

/**
 * Atualiza um evento existente no Google Calendar
 */
export async function updateCalendarEvent(
  googleEventId: string,
  input: Partial<CalendarEventInput>
): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const patch: calendar_v3.Schema$Event = {};

    if (input.title) patch.summary = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.startDateTime) {
      patch.start = { dateTime: input.startDateTime, timeZone: TIMEZONE };
    }
    if (input.endDateTime) {
      patch.end = { dateTime: input.endDateTime, timeZone: TIMEZONE };
    }
    if (input.attendees) {
      patch.attendees = input.attendees.map((a) => ({
        email: a.email,
        displayName: a.displayName,
      }));
    }

    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: googleEventId,
      requestBody: patch,
      sendUpdates: 'all',
    });

    return true;
  } catch (error) {
    console.error('[GoogleCalendar] Erro ao atualizar evento:', error);
    return false;
  }
}

/**
 * Cancela/deleta um evento no Google Calendar
 */
export async function deleteCalendarEvent(googleEventId: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: googleEventId,
      sendUpdates: 'all', // notifica os participantes do cancelamento
    });

    return true;
  } catch (error) {
    console.error('[GoogleCalendar] Erro ao deletar evento:', error);
    return false;
  }
}

/**
 * Marca um evento como realizado (atualiza título e descrição)
 */
export async function markEventAsCompleted(
  googleEventId: string,
  sessionSummary?: string
): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    // Busca o evento atual para preservar o título
    const current = await calendar.events.get({
      calendarId: CALENDAR_ID,
      eventId: googleEventId,
    });

    const currentTitle = current.data.summary || '';
    const newTitle = currentTitle.startsWith('✅') ? currentTitle : `✅ ${currentTitle}`;

    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: googleEventId,
      requestBody: {
        summary: newTitle,
        description: sessionSummary
          ? `${current.data.description || ''}\n\n--- Sessão Realizada ---\n${sessionSummary}`
          : current.data.description,
        colorId: '2', // verde (sage)
      },
      sendUpdates: 'none',
    });

    return true;
  } catch (error) {
    console.error('[GoogleCalendar] Erro ao marcar evento como realizado:', error);
    return false;
  }
}

/**
 * Alias para markEventAsCompleted (usado no createSession)
 */
export const markCalendarEventRealized = markEventAsCompleted;

/**
 * Testa a conexão com o Google Calendar
 */
export async function testCalendarConnection(): Promise<boolean> {
  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.calendarList.list({ maxResults: 1 });
    return true;
  } catch (error) {
    console.error('[GoogleCalendar] Erro de conexão:', error);
    return false;
  }
}
