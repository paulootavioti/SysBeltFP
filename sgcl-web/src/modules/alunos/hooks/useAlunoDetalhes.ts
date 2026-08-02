import { useCallback, useEffect, useState } from "react";

import { AlunoService } from "../services/AlunoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import type { AlunoCompleto, AlunoCompletoBasico } from "../types/alunoCompleto";

export interface ResumoBasicoAluno {
  id: number;
  nome: string;
  apelido?: string | null;
  faixa?: string;
  grau?: number;
  ativo?: boolean;
  turma?: { id: number; nome: string } | null;
  fotoUrl?: string | null;
}

// hook único pra Alunos > Detalhes: decide sozinho entre buscarBasico (visão
// redigida do PROFESSOR) e buscar (ficha completa) — antes esse if vivia
// duplicado em carregarAluno/recarregarAluno na página.
//
// "Carregamento progressivo" aqui quer dizer: se a navegação já chegou com
// um resumo conhecido (ex.: clicando em "Detalhes" na listagem, que já tinha
// nome/faixa/grau/turma na mão), o cabeçalho (AlunoResumo) aparece na hora
// com esse resumo — sem esperar a ficha completa (que inclui presenças,
// financeiro, graduações etc. e é mais pesada). As abas dependem da ficha
// completa e ficam com o próprio carregando até ela chegar. Sem resumo prévio
// (acesso direto pela URL), o comportamento cai pro mesmo Loading de sempre.
export function useAlunoDetalhes(
  id: string | undefined,
  ehProfessor: boolean,
  resumoInicial?: ResumoBasicoAluno
) {
  const [aluno, setAluno] = useState<AlunoCompleto | AlunoCompletoBasico | null>(null);
  const [carregandoCompleto, setCarregandoCompleto] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!id) return;

    try {
      setCarregandoCompleto(true);
      setErro("");

      const data = ehProfessor
        ? await AlunoService.buscarBasico(Number(id))
        : await AlunoService.buscar(Number(id));

      setAluno(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar aluno."));
    } finally {
      setCarregandoCompleto(false);
    }
  }, [id, ehProfessor]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    // ficha completa (null até a resposta chegar).
    aluno,
    // pro cabeçalho: usa a ficha completa assim que chega, senão o resumo
    // que já veio da navegação (se houver).
    resumoBasico: aluno ?? resumoInicial ?? null,
    // só é "carregando" de verdade (tela em branco) quando não há nem
    // resumo prévio nem ficha completa ainda.
    carregando: carregandoCompleto && !resumoInicial && !aluno,
    carregandoCompleto,
    erro,
    recarregar: carregar,
  };
}
