-- EcoDISC 360: vincula o Perfil DISC da Diretoria ao Perfil DISC da Empresa
-- (ciclo) ao qual ele pertence. Esse vinculo permite que, ao consolidar o
-- Perfil da Empresa a partir do questionario de cultura, as respostas de
-- cada Diretoria vinculada sejam somadas as respostas diretas da Empresa,
-- sem misturar diferentes ciclos/pesquisas que porventura coexistam
-- (ex: "Cultura 2025" e "Cultura 2026" rodando ao mesmo tempo).
--
-- Migration manual (nao gerada via 'pnpm db:generate'), no mesmo padrao
-- das migrations anteriores deste modulo (0087 a 0097).

ALTER TABLE `disc_org_profiles` ADD COLUMN `empresaProfileId` int NULL;
