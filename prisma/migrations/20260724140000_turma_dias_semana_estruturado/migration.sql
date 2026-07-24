-- Troca Turma.diasSemana de texto livre para um array estruturado de dias
-- (0=domingo..6=sábado, mesma convenção de Date.getDay() já usada em
-- AulaProgramada/ReplicarProgramacaoService).
--
-- ATENÇÃO: texto livre (ex.: "Segunda, Quarta e Sexta") não é parseável de
-- forma confiável, então esta migration DESCARTA os valores atuais da
-- coluna. Turmas existentes ficam com diasSemana = {} até serem reeditadas
-- pela tela de Turmas.
ALTER TABLE "Turma" DROP COLUMN "diasSemana";
ALTER TABLE "Turma" ADD COLUMN "diasSemana" INTEGER[] NOT NULL DEFAULT '{}';
