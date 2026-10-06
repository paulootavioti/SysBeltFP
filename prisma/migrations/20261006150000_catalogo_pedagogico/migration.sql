CREATE TYPE "TipoItemCatalogoPedagogico" AS ENUM ('POSICAO', 'EXERCICIO', 'MOMENTO');

CREATE TABLE "ItemCatalogoPedagogico" (
  "id" SERIAL NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "tipo" "TipoItemCatalogoPedagogico" NOT NULL,
  "nome" TEXT NOT NULL,
  "tipoBloco" "TipoBlocoAulaCurriculo",
  "descricao" TEXT,
  "atencoesFaixaEtaria" TEXT,
  "duracaoPrevistaSegundos" INTEGER NOT NULL DEFAULT 300,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItemCatalogoPedagogico_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ItemCatalogoPedagogico_unidadeId_tipo_nome_idx"
ON "ItemCatalogoPedagogico"("unidadeId", "tipo", "nome");

ALTER TABLE "ItemCatalogoPedagogico"
ADD CONSTRAINT "ItemCatalogoPedagogico_unidadeId_fkey"
FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
