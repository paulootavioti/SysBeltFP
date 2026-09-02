ALTER TYPE "TipoConsentimento" ADD VALUE 'TRATAMENTO_DADOS';
ALTER TABLE "Consentimento" ADD COLUMN "textoAceito" TEXT;
