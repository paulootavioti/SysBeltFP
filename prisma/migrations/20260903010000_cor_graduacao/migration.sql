ALTER TABLE "Graduacao" ADD COLUMN "cor" TEXT;

ALTER TABLE "Graduacao"
ADD CONSTRAINT "Graduacao_cor_formato_check"
CHECK ("cor" IS NULL OR "cor" ~ '^#[0-9A-Fa-f]{6}$');
