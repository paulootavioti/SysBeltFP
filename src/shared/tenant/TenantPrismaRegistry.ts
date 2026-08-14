import { PrismaClient } from "@prisma/client";

export interface IdentidadeConexaoTenant {
  tenantKey: string;
  credentialVersion: number;
}

type Cliente = PrismaClient;
type FabricaCliente = (pooledUrl: string) => Cliente;
type CarregarUrl = () => Promise<string>;

interface Entrada {
  client: Cliente;
  credentialVersion: number;
  ultimoUso: number;
}

function criarCliente(pooledUrl: string): Cliente {
  return new PrismaClient({
    datasourceUrl: pooledUrl,
    omit: { responsavel: { senhaPortal: true }, aluno: { senhaPortal: true } },
  });
}

export class TenantPrismaRegistry {
  private readonly entradas = new Map<string, Entrada>();
  private readonly criacoes = new Map<string, Promise<Cliente>>();

  constructor(
    private readonly limite = 10,
    private readonly ociosidadeMs = 5 * 60_000,
    private readonly fabrica: FabricaCliente = criarCliente,
    private readonly agora: () => number = Date.now,
  ) {
    if (!Number.isInteger(limite) || limite < 1 || limite > 100) throw new Error("Limite de clientes inválido.");
  }

  async obter(identidade: IdentidadeConexaoTenant, carregarUrl: CarregarUrl): Promise<Cliente> {
    await this.removerOciosos();
    const existente = this.entradas.get(identidade.tenantKey);
    if (existente?.credentialVersion === identidade.credentialVersion) {
      existente.ultimoUso = this.agora();
      return existente.client;
    }
    if (existente) await this.remover(identidade.tenantKey);

    const emAndamento = this.criacoes.get(identidade.tenantKey);
    if (emAndamento) return emAndamento;
    const criacao = this.criar(identidade, carregarUrl);
    this.criacoes.set(identidade.tenantKey, criacao);
    try { return await criacao; }
    finally { this.criacoes.delete(identidade.tenantKey); }
  }

  async invalidar(tenantKey: string): Promise<void> { await this.remover(tenantKey); }

  async encerrar(): Promise<void> {
    await Promise.all([...this.entradas.values()].map(({ client }) => client.$disconnect()));
    this.entradas.clear();
  }

  private async criar(identidade: IdentidadeConexaoTenant, carregarUrl: CarregarUrl): Promise<Cliente> {
    const client = this.fabrica(await carregarUrl());
    this.entradas.set(identidade.tenantKey, {
      client, credentialVersion: identidade.credentialVersion, ultimoUso: this.agora(),
    });
    await this.aplicarLimite(identidade.tenantKey);
    return client;
  }

  private async removerOciosos(): Promise<void> {
    const corte = this.agora() - this.ociosidadeMs;
    for (const [tenantKey, entrada] of this.entradas) {
      if (entrada.ultimoUso <= corte) await this.remover(tenantKey);
    }
  }

  private async aplicarLimite(preservar: string): Promise<void> {
    while (this.entradas.size > this.limite) {
      const candidatas = [...this.entradas.entries()].filter(([chave]) => chave !== preservar);
      candidatas.sort((a, b) => a[1].ultimoUso - b[1].ultimoUso);
      if (!candidatas[0]) return;
      await this.remover(candidatas[0][0]);
    }
  }

  private async remover(tenantKey: string): Promise<void> {
    const entrada = this.entradas.get(tenantKey);
    if (!entrada) return;
    this.entradas.delete(tenantKey);
    await entrada.client.$disconnect();
  }
}
