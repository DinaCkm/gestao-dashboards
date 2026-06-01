ALTER TABLE `processos_seletivos` ADD COLUMN IF NOT EXISTS `emailsRelatorio` text COMMENT 'E-mails separados por vírgula para receber relatório diário do processo';
