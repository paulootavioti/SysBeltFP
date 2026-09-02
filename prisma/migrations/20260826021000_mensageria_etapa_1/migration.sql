CREATE TYPE "TipoCanalMensageria" AS ENUM ('WHATSAPP', 'INSTAGRAM');
CREATE TYPE "EstadoConversaMensageria" AS ENUM ('ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO_CONTATO', 'ENCERRADA');
CREATE TYPE "DirecaoMensagemMensageria" AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE "AutorMensagemMensageria" AS ENUM ('CONTATO', 'ATENDENTE', 'BOT', 'SISTEMA');
CREATE TYPE "TipoConteudoMensageria" AS ENUM ('TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'LOCALIZACAO', 'CONTATO', 'REACAO', 'DESCONHECIDO');
CREATE TYPE "StatusEntregaMensageria" AS ENUM ('RECEBIDA', 'PENDENTE', 'ENVIADA', 'ENTREGUE', 'LIDA', 'FALHOU');
CREATE TYPE "StatusEventoMensageriaEntrada" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHOU');

CREATE TABLE "CanalMensageria" (
  "id" SERIAL NOT NULL, "unidadeId" INTEGER NOT NULL, "tipo" "TipoCanalMensageria" NOT NULL,
  "identificadorExterno" TEXT NOT NULL, "nomeExibicao" TEXT NOT NULL, "tokenRef" TEXT NOT NULL,
  "verifyTokenRef" TEXT NOT NULL, "canalCaptacaoId" INTEGER, "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanalMensageria_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ConversaMensageria" (
  "id" SERIAL NOT NULL, "unidadeId" INTEGER NOT NULL, "canalMensageriaId" INTEGER NOT NULL,
  "leadId" INTEGER, "alunoId" INTEGER, "contatoExternoId" TEXT NOT NULL, "contatoNome" TEXT,
  "estado" "EstadoConversaMensageria" NOT NULL DEFAULT 'ABERTA', "atendenteId" INTEGER,
  "naoLidas" INTEGER NOT NULL DEFAULT 0, "ultimaMensagemEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversaMensageria_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MensagemMensageria" (
  "id" SERIAL NOT NULL, "conversaId" INTEGER NOT NULL, "canalMensageriaId" INTEGER NOT NULL,
  "mensagemExternaId" TEXT NOT NULL, "direcao" "DirecaoMensagemMensageria" NOT NULL,
  "autor" "AutorMensagemMensageria" NOT NULL, "usuarioId" INTEGER, "conteudo" TEXT,
  "tipoConteudo" "TipoConteudoMensageria" NOT NULL DEFAULT 'TEXTO', "payload" JSONB,
  "statusEntrega" "StatusEntregaMensageria" NOT NULL DEFAULT 'RECEBIDA', "enviadaEm" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MensagemMensageria_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventoMensageriaEntrada" (
  "id" SERIAL NOT NULL, "canalMensageriaId" INTEGER NOT NULL, "eventoExternoId" TEXT NOT NULL,
  "payload" JSONB NOT NULL, "status" "StatusEventoMensageriaEntrada" NOT NULL DEFAULT 'PENDENTE',
  "tentativas" INTEGER NOT NULL DEFAULT 0, "proximaTentativaEm" TIMESTAMP(3), "erro" TEXT,
  "processadoEm" TIMESTAMP(3), "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "EventoMensageriaEntrada_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CanalMensageria_tipo_identificadorExterno_key" ON "CanalMensageria"("tipo", "identificadorExterno");
CREATE INDEX "CanalMensageria_unidadeId_ativo_idx" ON "CanalMensageria"("unidadeId", "ativo");
CREATE UNIQUE INDEX "ConversaMensageria_canalMensageriaId_contatoExternoId_key" ON "ConversaMensageria"("canalMensageriaId", "contatoExternoId");
CREATE INDEX "ConversaMensageria_unidadeId_estado_ultimaMensagemEm_idx" ON "ConversaMensageria"("unidadeId", "estado", "ultimaMensagemEm");
CREATE UNIQUE INDEX "MensagemMensageria_canalMensageriaId_mensagemExternaId_key" ON "MensagemMensageria"("canalMensageriaId", "mensagemExternaId");
CREATE INDEX "MensagemMensageria_conversaId_enviadaEm_idx" ON "MensagemMensageria"("conversaId", "enviadaEm");
CREATE UNIQUE INDEX "EventoMensageriaEntrada_canalMensageriaId_eventoExternoId_key" ON "EventoMensageriaEntrada"("canalMensageriaId", "eventoExternoId");
CREATE INDEX "EventoMensageriaEntrada_status_proximaTentativaEm_criadoEm_idx" ON "EventoMensageriaEntrada"("status", "proximaTentativaEm", "criadoEm");

ALTER TABLE "CanalMensageria" ADD CONSTRAINT "CanalMensageria_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CanalMensageria" ADD CONSTRAINT "CanalMensageria_canalCaptacaoId_fkey" FOREIGN KEY ("canalCaptacaoId") REFERENCES "CanalCaptacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversaMensageria" ADD CONSTRAINT "ConversaMensageria_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversaMensageria" ADD CONSTRAINT "ConversaMensageria_canalMensageriaId_fkey" FOREIGN KEY ("canalMensageriaId") REFERENCES "CanalMensageria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversaMensageria" ADD CONSTRAINT "ConversaMensageria_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversaMensageria" ADD CONSTRAINT "ConversaMensageria_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversaMensageria" ADD CONSTRAINT "ConversaMensageria_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MensagemMensageria" ADD CONSTRAINT "MensagemMensageria_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaMensageria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MensagemMensageria" ADD CONSTRAINT "MensagemMensageria_canalMensageriaId_fkey" FOREIGN KEY ("canalMensageriaId") REFERENCES "CanalMensageria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MensagemMensageria" ADD CONSTRAINT "MensagemMensageria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventoMensageriaEntrada" ADD CONSTRAINT "EventoMensageriaEntrada_canalMensageriaId_fkey" FOREIGN KEY ("canalMensageriaId") REFERENCES "CanalMensageria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
