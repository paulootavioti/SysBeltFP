ALTER TABLE "Unidade"
  ADD COLUMN "landingSlug" TEXT,
  ADD COLUMN "landingPublicada" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "landingNome" TEXT,
  ADD COLUMN "landingDescricao" TEXT,
  ADD COLUMN "landingEndereco" TEXT,
  ADD COLUMN "landingCidade" TEXT,
  ADD COLUMN "landingUf" TEXT,
  ADD COLUMN "landingCep" TEXT,
  ADD COLUMN "landingTelefone" TEXT,
  ADD COLUMN "landingWhatsapp" TEXT,
  ADD COLUMN "landingHorario" TEXT,
  ADD COLUMN "landingFotoCapaUrl" TEXT,
  ADD COLUMN "landingDominio" TEXT;

CREATE UNIQUE INDEX "Unidade_landingSlug_key" ON "Unidade"("landingSlug");
