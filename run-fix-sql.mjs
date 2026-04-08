import mysql from 'mysql2/promise';

const fixSQL = `ALTER TABLE cursos_competencias
  MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT,
  MODIFY COLUMN competenciaId INT NOT NULL,
  MODIFY COLUMN titulo VARCHAR(255) NOT NULL,
  MODIFY COLUMN descricao TEXT NULL,
  MODIFY COLUMN capaUrl VARCHAR(500) NULL,
  MODIFY COLUMN ordem INT NOT NULL DEFAULT 0,
  MODIFY COLUMN isActive INT NOT NULL DEFAULT 1,
  MODIFY COLUMN createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`;

console.log('Conectando ao banco de dados...');

try {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('✅ Conectado ao banco de dados');
  console.log('Executando SQL de correção...');
  
  await connection.execute(fixSQL);
  
  console.log('✅ SQL executado com sucesso!');
  await connection.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
