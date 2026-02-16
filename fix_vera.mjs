import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Conectar ao banco via drizzle-kit
const dbUrl = process.env.DATABASE_URL || readFileSync('.env', 'utf8')
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]?.trim() || '';

console.log('Conectando ao banco...');

// Primeiro, vamos listar os mentores disponíveis
const getMentores = `
SELECT id, name FROM consultors WHERE isActive = 1 LIMIT 10;
`;

// Buscar a Vera
const getVera = `
SELECT id, name, consultorId FROM alunos WHERE email = 'vera.braga@to.sebrae.com.br';
`;

console.log('\nExecutando queries...');
console.log(getMentores);
console.log(getVera);

