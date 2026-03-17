import superjson from 'superjson';

// Simulate the server-side data
const serverData = {
  // macroInicio as Date (from Drizzle, passed through superjson)
  macroInicio: new Date('2025-03-24T04:00:00.000Z'),
  macroTermino: new Date('2026-03-30T04:00:00.000Z'),
  // ultimaSessao as ISO string (manually converted on server)
  ultimaSessao: '2026-01-29T05:00:00.000Z',
};

console.log('=== SERVER SIDE ===');
console.log('macroInicio (Date):', serverData.macroInicio.toISOString());
console.log('ultimaSessao (string):', serverData.ultimaSessao);

// Superjson serialization (what tRPC does)
const serialized = superjson.serialize(serverData);
console.log('\n=== SERIALIZED (over the wire) ===');
console.log(JSON.stringify(serialized, null, 2));

// Superjson deserialization (what the client does)
const clientData = superjson.deserialize(serialized);
console.log('\n=== CLIENT SIDE (deserialized) ===');
console.log('macroInicio type:', typeof clientData.macroInicio, clientData.macroInicio instanceof Date);
console.log('macroInicio value:', clientData.macroInicio);
console.log('ultimaSessao type:', typeof clientData.ultimaSessao);
console.log('ultimaSessao value:', clientData.ultimaSessao);

// Now simulate what the frontend formatDate does
console.log('\n=== FRONTEND formatDate ===');
// For macroInicio (Date object from superjson)
const d1 = new Date(clientData.macroInicio);
console.log('macroInicio toLocaleDateString:', d1.toLocaleDateString('pt-BR'));

// For ultimaSessao (string)
const d2 = new Date(clientData.ultimaSessao);
console.log('ultimaSessao toLocaleDateString:', d2.toLocaleDateString('pt-BR'));

// The fix: always use UTC
console.log('\n=== FIXED (UTC-based) ===');
function formatDateUTC(dateInput) {
  const d = new Date(dateInput);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
console.log('macroInicio UTC:', formatDateUTC(clientData.macroInicio));
console.log('ultimaSessao UTC:', formatDateUTC(clientData.ultimaSessao));

// But wait - the dates from DB have server timezone offset baked in
// So even UTC won't be correct if the server stored them at 04:00 or 05:00 UTC
// The REAL fix is to normalize dates on the server side to noon UTC
// or to extract just the date string (YYYY-MM-DD) and pass it as a string
console.log('\n=== BEST FIX: pass date-only strings from server ===');
// On server: instead of toISOString(), use toISOString().split('T')[0]
const dateOnly = serverData.macroInicio.toISOString().split('T')[0];
console.log('macroInicio as date string:', dateOnly);
// On client: new Date(dateString + 'T12:00:00') to avoid timezone issues
const safeDate = new Date(dateOnly + 'T12:00:00');
console.log('Safe date toLocaleDateString:', safeDate.toLocaleDateString('pt-BR'));
