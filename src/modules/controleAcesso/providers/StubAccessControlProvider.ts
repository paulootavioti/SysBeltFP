import {
  ProvedorAcessoNaoImplementadoError,
  type AccessControlProvider,
  type ComandoAberturaResultado,
  type EventoAcessoNormalizado,
  type PessoaAcessoDTO,
  type SincronizarPessoaResultado,
} from "./AccessControlProvider";

// Base dos provedores nomeados de fabricante. Cada um deles existe pra que a
// escolha do equipamento seja uma configuração (Dispositivo.provedor), não uma
// mudança de código nas regras de negócio — mas nenhuma integração real foi
// escrita ainda, então todo método falha de forma explícita em vez de fingir
// que funcionou.
//
// Ao integrar um fabricante de verdade, herde desta classe e sobrescreva
// apenas os métodos que aquele equipamento suporta.
export abstract class StubAccessControlProvider implements AccessControlProvider {
  abstract readonly nome: string;

  // a maioria dos equipamentos de mercado guarda os templates e decide
  // localmente; quem não fizer isso sobrescreve para false.
  readonly decideLocalmente: boolean = true;

  async sincronizarPessoa(_dados: PessoaAcessoDTO): Promise<SincronizarPessoaResultado> {
    throw new ProvedorAcessoNaoImplementadoError(this.nome);
  }

  async removerPessoa(): Promise<void> {
    throw new ProvedorAcessoNaoImplementadoError(this.nome);
  }

  normalizarEvento(_payload: unknown): EventoAcessoNormalizado {
    throw new ProvedorAcessoNaoImplementadoError(this.nome);
  }

  async abrirRemotamente(): Promise<ComandoAberturaResultado> {
    throw new ProvedorAcessoNaoImplementadoError(this.nome);
  }
}
