import type { Aluno } from "../types";

export function formatarDataParaInput(data?: string | null) {
  if (!data) return "";

  return data.slice(0, 10);
}

export function alunoParaFormulario(aluno?: Partial<Aluno>) {
  const primeiroResponsavel = aluno?.responsaveis?.[0];

  return {
    nome: aluno?.nome ?? "",
    dataNascimento: formatarDataParaInput(aluno?.dataNascimento),
    sexo: aluno?.sexo ?? "",
    cpf: aluno?.cpf ?? "",
    rg: aluno?.rg ?? "",
    telefone: aluno?.telefone ?? "",
    whatsapp: aluno?.whatsapp ?? "",
    email: aluno?.email ?? "",
    cep: aluno?.cep ?? "",
    logradouro: aluno?.logradouro ?? "",
    numero: aluno?.numero ?? "",
    complemento: aluno?.complemento ?? "",
    bairro: aluno?.bairro ?? "",
    cidade: aluno?.cidade ?? "",
    uf: aluno?.uf ?? "",
    escola: aluno?.escola ?? "",
    serieEscolar: aluno?.serieEscolar ?? "",
    turnoEscolar: aluno?.turnoEscolar ?? "",
    peso: aluno?.peso?.toString() ?? "",
    altura: aluno?.altura?.toString() ?? "",

    restricoesMedicas: aluno?.restricoesMedicas ?? "",
    alergias: aluno?.alergias ?? "",
    medicamentos: aluno?.medicamentos ?? "",

    tamanhoKimono: aluno?.tamanhoKimono ?? "",
    marcaKimono: aluno?.marcaKimono ?? "",

    observacoes: aluno?.observacoes ?? "",

    turmaId: aluno?.turmaId?.toString() ?? "",

    fotoUrl: aluno?.fotoUrl ?? "",

    responsavel: {
      id: primeiroResponsavel?.id,
      nome: primeiroResponsavel?.nome ?? "",
      parentesco: primeiroResponsavel?.parentesco ?? "",
      telefone: primeiroResponsavel?.telefone ?? "",
      whatsapp: primeiroResponsavel?.whatsapp ?? "",
      email: primeiroResponsavel?.email ?? "",
      responsavelFinanceiro: primeiroResponsavel?.responsavelFinanceiro ?? false,
      podeBuscar: primeiroResponsavel?.podeBuscar ?? true,
      contatoEmergencia: primeiroResponsavel?.contatoEmergencia ?? false,
      recebeComunicados: primeiroResponsavel?.recebeComunicados ?? true,
    },
  };
}
