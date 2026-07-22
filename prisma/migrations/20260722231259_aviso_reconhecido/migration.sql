-- CreateTable
CREATE TABLE "AvisoReconhecido" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvisoReconhecido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvisoReconhecido_usuarioId_tipo_referenciaId_key" ON "AvisoReconhecido"("usuarioId", "tipo", "referenciaId");

-- AddForeignKey
ALTER TABLE "AvisoReconhecido" ADD CONSTRAINT "AvisoReconhecido_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
