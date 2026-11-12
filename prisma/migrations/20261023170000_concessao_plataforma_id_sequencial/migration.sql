-- A tabela nasceu como singleton (uma concessão por banco): o id tinha
-- DEFAULT 1, sem sequência. A migração para banco compartilhado removeu a
-- trava de linha única, mas não o DEFAULT — então a segunda conta a receber
-- concessão colidia no id 1 e o Control Plane recebia 500. O schema Prisma
-- já declara autoincrement(); aqui o banco passa a corresponder a ele.
CREATE SEQUENCE IF NOT EXISTS "ConcessaoPlataforma_id_seq" OWNED BY "ConcessaoPlataforma"."id";

SELECT setval(
  '"ConcessaoPlataforma_id_seq"',
  COALESCE((SELECT MAX("id") FROM "ConcessaoPlataforma"), 0) + 1,
  false
);

ALTER TABLE "ConcessaoPlataforma"
  ALTER COLUMN "id" SET DEFAULT nextval('"ConcessaoPlataforma_id_seq"');
