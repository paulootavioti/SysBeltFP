CREATE TYPE "TipoCanalMensageria" AS ENUM ('WHATSAPP', 'INSTAGRAM');

CREATE TABLE "ContaMensageriaDiretorio" (
    "id" UUID NOT NULL,
    "assinanteId" UUID NOT NULL,
    "tipo" "TipoCanalMensageria" NOT NULL,
    "identificadorExterno" TEXT NOT NULL,
    "appSecretRef" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContaMensageriaDiretorio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContaMensageriaDiretorio_tipo_identificadorExterno_key"
ON "ContaMensageriaDiretorio"("tipo", "identificadorExterno");
CREATE INDEX "ContaMensageriaDiretorio_assinanteId_ativo_idx"
ON "ContaMensageriaDiretorio"("assinanteId", "ativo");
ALTER TABLE "ContaMensageriaDiretorio" ADD CONSTRAINT "ContaMensageriaDiretorio_assinanteId_fkey"
FOREIGN KEY ("assinanteId") REFERENCES "Assinante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
