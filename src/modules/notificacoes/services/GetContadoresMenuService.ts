import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { ListProximasGraduacoesService } from "../../graduacoes/services/ListProximasGraduacoesService";

export interface ContadoresMenu {
  mensalidadesVencidas: number;
  contratosAguardandoAssinatura: number;
  graduacoesPendentes: number;
  mensagensFamiliaNaoLidas: number;
}

const listProximasGraduacoesService = new ListProximasGraduacoesService();

// Contadores leves pra alimentar os badges do menu lateral — cada número
// aqui tem uma tela de destino já existente (Mensalidades, Contratos,
// Próximas Promoções, Mensagens da Família), então o cálculo reaproveita
// a mesma regra de negócio que essas telas já usam, só trocando a lista
// completa por uma contagem. Pensado pra ser barato o bastante pra rodar
// em toda troca de página (ver useContadoresMenu no frontend).
export class GetContadoresMenuService {
  async execute(unidadeId: number | null): Promise<ContadoresMenu> {
    const [mensalidadesVencidas, contratosAguardandoAssinatura, proximasGraduacoes, mensagensFamiliaNaoLidas] =
      await Promise.all([
        prisma.mensalidade.count({
          where: { pago: false, vencimento: { lt: new Date() }, ...escopoUnidade(unidadeId) },
        }),
        prisma.contrato.count({
          where: { situacao: "PENDENTE_ASSINATURA", ...escopoUnidade(unidadeId) },
        }),
        listProximasGraduacoesService.execute(unidadeId),
        prisma.mensagemFamilia.count({
          where: { remetenteTipo: "FAMILIA", lida: false, ...escopoUnidade(unidadeId) },
        }),
      ]);

    return {
      mensalidadesVencidas,
      contratosAguardandoAssinatura,
      graduacoesPendentes: proximasGraduacoes.length,
      mensagensFamiliaNaoLidas,
    };
  }
}
