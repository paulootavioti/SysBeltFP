ALTER TABLE "Usuario"
ADD COLUMN "doisFatoresAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "doisFatoresSegredo" TEXT,
ADD COLUMN "doisFatoresPendente" TEXT,
ADD COLUMN "doisFatoresAtivadoEm" TIMESTAMP(3);
