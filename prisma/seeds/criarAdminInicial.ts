// Cria (ou atualiza a senha de) o primeiro usuário ADMIN e garante uma
// unidade ativa. O ambiente local precisa sair deste seed pronto para operar.
// Necessário porque POST /auth/register exige um ADMIN autenticado —
// num banco novo (ex.: recém-migrado para o Netlify/Neon) não existe
// nenhum usuário ainda, então não há como logar para criar o primeiro.
//
// Uso: DATABASE_URL="..." npx ts-node prisma/seeds/criarAdminInicial.ts
// Variáveis opcionais: ADMIN_NOME, ADMIN_EMAIL, ADMIN_SENHA,
// CONTA_INICIAL_NOME e UNIDADE_INICIAL_NOME.
// (senha default só serve para teste — troque depois do primeiro login).

import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const nome = process.env.ADMIN_NOME || "Administrador";
  const email = process.env.ADMIN_EMAIL || "admin@sysbelt.com";
  const senha = process.env.ADMIN_SENHA || "admin123";
  const contaNome = process.env.CONTA_INICIAL_NOME || "Conta principal";
  const unidadeNome = process.env.UNIDADE_INICIAL_NOME || "Unidade Principal";
  const canalCaptacaoSlug = process.env.CANAL_CAPTACAO_INICIAL_SLUG || "landing-principal";

  const senhaHash = await hash(senha, 8);

  const usuario = await prisma.$transaction(async (tx) => {
    let unidade = await tx.unidade.findFirst({
      where: { ativo: true },
      orderBy: { id: "asc" },
    });

    if (!unidade) {
      let conta = await tx.conta.findFirst({ orderBy: { id: "asc" } });
      conta ??= await tx.conta.create({ data: { nome: contaNome } });
      unidade = await tx.unidade.create({ data: { nome: unidadeNome, contaId: conta.id } });
    }

    const admin = await tx.usuario.upsert({
      where: { email },
      update: { nome, senha: senhaHash, perfil: "ADMIN", ativo: true, unidadeId: unidade.id },
      create: { nome, email, senha: senhaHash, perfil: "ADMIN", unidadeId: unidade.id },
    });

    await tx.usuarioUnidade.upsert({
      where: { usuarioId_unidadeId: { usuarioId: admin.id, unidadeId: unidade.id } },
      update: {},
      create: { usuarioId: admin.id, unidadeId: unidade.id },
    });

    await tx.canalCaptacao.upsert({
      where: { slug: canalCaptacaoSlug },
      update: { unidadeId: unidade.id, nome: "Landing principal", ativo: true },
      create: { unidadeId: unidade.id, nome: "Landing principal", slug: canalCaptacaoSlug },
    });

    return admin;
  });

  console.log(`Usuário ADMIN pronto: ${usuario.email} (id ${usuario.id})`);
  console.log("Se usou a senha default, troque-a após o primeiro login.");
}

main()
  .catch((err) => {
    console.error("Erro ao criar admin inicial:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
