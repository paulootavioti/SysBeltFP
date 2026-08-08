-- Introduz a Conta (o cliente do SysBelt) acima da Unidade, e o domínio de
-- cobrança da plataforma: plano por faixa de alunos, assinatura e fatura.
--
-- A ordem aqui é deliberada. O SQL que o Prisma gera sozinho começa com
-- `ALTER TABLE "Unidade" ADD COLUMN "contaId" INTEGER NOT NULL`, que falha
-- em qualquer banco que já tenha unidades cadastradas. Aqui a coluna nasce
-- aceitando nulo, as unidades existentes são adotadas por uma conta criada
-- na hora, e só então a coluna vira obrigatória.

-- CreateEnum
CREATE TYPE "StatusAssinaturaPlataforma" AS ENUM ('TESTE', 'ATIVA', 'INADIMPLENTE', 'SUSPENSA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusFaturaPlataforma" AS ENUM ('ABERTA', 'PAGA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Conta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "emailCobranca" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoPlataforma" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "alunosPorBloco" INTEGER NOT NULL,
    "precoPorBlocoCentavos" INTEGER NOT NULL,
    "blocosMinimos" INTEGER NOT NULL DEFAULT 1,
    "recursos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanoPlataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaPlataforma" (
    "id" SERIAL NOT NULL,
    "contaId" INTEGER NOT NULL,
    "planoId" INTEGER NOT NULL,
    "status" "StatusAssinaturaPlataforma" NOT NULL DEFAULT 'TESTE',
    "precoPorBlocoCentavos" INTEGER,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "inicioEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimTesteEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssinaturaPlataforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaturaPlataforma" (
    "id" SERIAL NOT NULL,
    "contaId" INTEGER NOT NULL,
    "assinaturaId" INTEGER NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "alunosContados" INTEGER NOT NULL,
    "alunosPorBloco" INTEGER NOT NULL,
    "blocos" INTEGER NOT NULL,
    "precoPorBlocoCentavos" INTEGER NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "status" "StatusFaturaPlataforma" NOT NULL DEFAULT 'ABERTA',
    "pagaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaturaPlataforma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanoPlataforma_nome_key" ON "PlanoPlataforma"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "AssinaturaPlataforma_contaId_key" ON "AssinaturaPlataforma"("contaId");

-- CreateIndex
CREATE UNIQUE INDEX "FaturaPlataforma_assinaturaId_competencia_key" ON "FaturaPlataforma"("assinaturaId", "competencia");

-- AlterTable: nasce aceitando nulo pra não quebrar em banco com dados.
ALTER TABLE "Unidade" ADD COLUMN "contaId" INTEGER;

-- Plano padrão de venda: faixas de 10 alunos a R$ 37,00 (3700 centavos).
INSERT INTO "PlanoPlataforma" ("nome", "descricao", "alunosPorBloco", "precoPorBlocoCentavos", "blocosMinimos", "recursos")
VALUES (
    'Essencial',
    'Cobrança por faixa: a cada 10 alunos ativos, R$ 37,00 por mês.',
    10,
    3700,
    1,
    ARRAY[]::TEXT[]
);

-- Adoção dos dados existentes: tudo que já está no banco pertence a uma
-- academia só, então vira UMA conta com todas as unidades atuais. Renomeie
-- depois pelo painel — o nome aqui é genérico de propósito, porque nomear
-- a conta com o nome de uma das filiais confundiria quem tem mais de uma.
INSERT INTO "Conta" ("nome")
SELECT 'Conta principal'
WHERE EXISTS (SELECT 1 FROM "Unidade");

UPDATE "Unidade"
SET "contaId" = (SELECT MIN("id") FROM "Conta")
WHERE "contaId" IS NULL;

-- A assinatura nasce em TESTE: o fechamento mensal ignora esse status, de
-- modo que a migração não gera cobrança pra quem já usava o sistema.
INSERT INTO "AssinaturaPlataforma" ("contaId", "planoId", "status")
SELECT c."id", p."id", 'TESTE'
FROM "Conta" c
CROSS JOIN "PlanoPlataforma" p
WHERE p."nome" = 'Essencial';

-- Agora que ninguém está órfão, a coluna vira obrigatória.
ALTER TABLE "Unidade" ALTER COLUMN "contaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Unidade" ADD CONSTRAINT "Unidade_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlataforma" ADD CONSTRAINT "AssinaturaPlataforma_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlataforma" ADD CONSTRAINT "AssinaturaPlataforma_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoPlataforma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaturaPlataforma" ADD CONSTRAINT "FaturaPlataforma_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaturaPlataforma" ADD CONSTRAINT "FaturaPlataforma_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "AssinaturaPlataforma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
