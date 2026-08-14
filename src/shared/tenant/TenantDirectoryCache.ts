import type { TenantDirectory, TenantResolvido } from "./TenantDirectory";

interface EntradaCache {
  valor: TenantResolvido | null;
  expiraEm: number;
  ultimoUso: number;
}

export class TenantDirectoryCache implements TenantDirectory {
  private readonly entradas = new Map<string, EntradaCache>();
  private readonly consultas = new Map<string, Promise<TenantResolvido | null>>();

  constructor(
    private readonly origem: TenantDirectory,
    private readonly ttlMs = 30_000,
    private readonly ttlNegativoMs = 5_000,
    private readonly limite = 500,
    private readonly agora: () => number = Date.now,
  ) {
    if (ttlMs < 1 || ttlNegativoMs < 1 || limite < 1) throw new Error("Configuração de cache inválida.");
  }

  async resolver(slug: string): Promise<TenantResolvido | null> {
    const instante = this.agora();
    const entrada = this.entradas.get(slug);
    if (entrada && entrada.expiraEm > instante) {
      entrada.ultimoUso = instante;
      return entrada.valor;
    }
    if (entrada) this.entradas.delete(slug);

    const pendente = this.consultas.get(slug);
    if (pendente) return pendente;
    const consulta = this.consultar(slug);
    this.consultas.set(slug, consulta);
    try { return await consulta; }
    finally { this.consultas.delete(slug); }
  }

  invalidar(slug: string): void { this.entradas.delete(slug); }
  limpar(): void { this.entradas.clear(); }

  private async consultar(slug: string): Promise<TenantResolvido | null> {
    const valor = await this.origem.resolver(slug);
    const instante = this.agora();
    this.entradas.set(slug, {
      valor,
      expiraEm: instante + (valor ? this.ttlMs : this.ttlNegativoMs),
      ultimoUso: instante,
    });
    this.aplicarLimite();
    return valor;
  }

  private aplicarLimite(): void {
    if (this.entradas.size <= this.limite) return;
    const maisAntiga = [...this.entradas.entries()].sort((a, b) => a[1].ultimoUso - b[1].ultimoUso)[0];
    if (maisAntiga) this.entradas.delete(maisAntiga[0]);
  }
}
