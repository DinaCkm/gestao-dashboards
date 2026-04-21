CREATE TABLE IF NOT EXISTS `certification_templates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nome` varchar(255) NOT NULL,
  `nivel` enum('I','II','III','IV') NOT NULL,
  `ativo` int NOT NULL DEFAULT 1,
  `arquivoModelo` text,
  `camposMapeados` json,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `certification_signatures` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `tipo` enum('gerente','mentora','gestor_master') NOT NULL,
  `nomeExibicao` varchar(255) NOT NULL,
  `cargo` varchar(255),
  `imagemAssinaturaUrl` text,
  `ativo` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `nivel_certificates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `alunoId` int NOT NULL,
  `contratoNivelId` int NOT NULL,
  `nivel` enum('I','II','III','IV') NOT NULL,
  `templateId` int NOT NULL,
  `status` enum('emitido','revogado') NOT NULL DEFAULT 'emitido',
  `arquivoUrl` text,
  `emitidoEm` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `emitidoPor` int,
  `hashDocumento` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_cert_por_nivel` (`alunoId`,`contratoNivelId`,`status`)
);

CREATE TABLE IF NOT EXISTS `nivel_certificate_mentoras` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `certificateId` int NOT NULL,
  `consultorId` int NOT NULL,
  `nomeMentora` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
