-- Migration: Biblioteca Pedagógica de Competências e Conteúdos (Fase 1)
-- Cria tabelas para fichas pedagógicas de competências e conteúdos

CREATE TABLE IF NOT EXISTS `fichas_pedagogicas_competencias` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `competenciaId` int NOT NULL,
  `linhaDesenvolvimento` text NOT NULL,
  `objetivoPedagogico` text NOT NULL,
  `oQueEnsina` text NOT NULL,
  `quandoIndicar` text NOT NULL,
  `sinaisObservaveis` text NOT NULL,
  `cuidadoIndicacao` text,
  `resumoMentor` text NOT NULL,
  `descricaoAluno` text NOT NULL,
  `sugestaoDesenvolvimentoCompetencia` text NOT NULL,
  `status` enum('rascunho','publicada','inativa') NOT NULL DEFAULT 'rascunho',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(255),
  `updatedBy` varchar(255)
);

CREATE TABLE IF NOT EXISTS `fichas_pedagogicas_conteudos` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `competenciaId` int NOT NULL,
  `conteudoId` int NOT NULL,
  `tipoConteudo` enum('intro','filme','video','tedtalk','podcast','livro','curso','outro') NOT NULL,
  `nomeConteudo` varchar(255) NOT NULL,
  `linkConteudo` varchar(1000),
  `papelPedagogico` text NOT NULL,
  `oQueAlunoAprende` text NOT NULL,
  `reflexaoEsperada` text NOT NULL,
  `quandoUsar` text,
  `orientacaoMentor` text NOT NULL,
  `descricaoAluno` text NOT NULL,
  `status` enum('rascunho','publicada','inativa') NOT NULL DEFAULT 'rascunho',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdBy` varchar(255),
  `updatedBy` varchar(255)
);
