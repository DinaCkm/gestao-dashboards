import { google } from 'googleapis';
import { JWT } from 'google-auth-library/build/src/index.js';
import { readFileSync } from 'fs';

const creds = JSON.parse(readFileSync('/home/ubuntu/upload/soy-tube-497019-k3-3ca5badfbcae.json', 'utf8'));

const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/calendar'],
  subject: 'relacionamento@ckmtalents.net'
});

const calendar = google.calendar({ version: 'v3', auth });

async function test() {
  try {
    const res = await calendar.events.insert({
      calendarId: 'relacionamento@ckmtalents.net',
      requestBody: {
        summary: 'TESTE DIAGNOSTICO - pode deletar',
        start: { dateTime: '2026-05-22T10:00:00-03:00', timeZone: 'America/Sao_Paulo' },
        end: { dateTime: '2026-05-22T11:00:00-03:00', timeZone: 'America/Sao_Paulo' },
        attendees: [{ email: 'dina@makiyama.com.br', displayName: 'Julia Makiyama' }],
        conferenceData: { createRequest: { requestId: 'diag-' + Date.now(), conferenceSolutionKey: { type: 'hangoutsMeet' } } }
      },
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });
    const meet = res.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
    console.log('OK! eventId:', res.data.id, '| meet:', meet);
    await calendar.events.delete({ calendarId: 'relacionamento@ckmtalents.net', eventId: res.data.id!, sendUpdates: 'none' });
    console.log('Evento de teste deletado.');
  } catch(e: any) {
    console.error('ERRO:', e.message);
    if (e.errors) console.error('Detalhes:', JSON.stringify(e.errors));
    if (e.response?.data) console.error('Response:', JSON.stringify(e.response.data));
  }
}
test();
