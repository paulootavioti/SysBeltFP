import { AppError } from "../../../shared/errors/AppError";
import { calcularIdade } from "../../mensagens/utils";

interface ResponsavelParaContrato {
  id: number;
  nome: string;
  responsavelFinanceiro: boolean;
  ativo: boolean;
}

interface ResultadoContratante {
  contratanteResponsavelId: number | null;
  ehMenorDeIdade: boolean;
}

// Regra do pedido: aluno menor de 18 anos → contratante obrigatoriamente
// é o responsável legal (o aluno segue identificado só como beneficiário
// do serviço); aluno maior de idade → o próprio aluno é o contratante.
// Entre os responsáveis, prioriza o marcado como responsável financeiro;
// na ausência de um marcado, usa o primeiro responsável ativo cadastrado.
export function determinarContratante(
  dataNascimentoAluno: Date,
  responsaveis: ResponsavelParaContrato[]
): ResultadoContratante {
  const ehMenorDeIdade = calcularIdade(dataNascimentoAluno) < 18;

  if (!ehMenorDeIdade) {
    return { contratanteResponsavelId: null, ehMenorDeIdade: false };
  }

  const responsaveisAtivos = responsaveis.filter((r) => r.ativo);
  const responsavelFinanceiro = responsaveisAtivos.find((r) => r.responsavelFinanceiro);
  const responsavel = responsavelFinanceiro || responsaveisAtivos[0];

  if (!responsavel) {
    throw new AppError(
      "Aluno é menor de idade e não possui responsável cadastrado. Cadastre um responsável antes de gerar o contrato."
    );
  }

  return { contratanteResponsavelId: responsavel.id, ehMenorDeIdade: true };
}
