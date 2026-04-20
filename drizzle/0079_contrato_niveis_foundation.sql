CREATE TABLE `contrato_niveis` (
  `id` int AUTO_INCREMENT NOT NULL,
  `contratoId` int NOT NULL,
  `alunoId` int NOT NULL,
  `nivel` enum('I','II','III','IV') NOT NULL,
  `dataInicio` date NOT NULL,
  `dataFim` date NOT NULL,
  `dataFechamentoOperacional` date NOT NULL,
  `dataLimiteAjustes` date NOT NULL,
  `status` enum('planejado','em_andamento','fechamento','ajustes','encerrado','certificado') NOT NULL DEFAULT 'planejado',
  `assessmentPdiId` int,
  `mentoraPrincipalId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `contrato_niveis_id` PRIMARY KEY(`id`)
);

CREATE INDEX `contrato_niveis_aluno_idx` ON `contrato_niveis` (`alunoId`);
CREATE INDEX `contrato_niveis_contrato_idx` ON `contrato_niveis` (`contratoId`);
CREATE INDEX `contrato_niveis_status_idx` ON `contrato_niveis` (`status`);
