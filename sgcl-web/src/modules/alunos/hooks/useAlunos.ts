import { useCallback, useEffect, useState } from "react";
import type { Aluno } from "../types";
import { AlunoService } from "../services/AlunoService";

interface FiltrosAlunos { pagina: number; busca: string; status: string; turmaId: string; }

export function useAlunos({ pagina, busca, status, turmaId }: FiltrosAlunos) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregarAlunos = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");
      const data = await AlunoService.listarPaginado({ pagina, porPagina: 15, busca, status, turmaId });
      if (Array.isArray(data)) {
        setAlunos(data);
        setTotal(data.length);
        setTotalPaginas(Math.max(1, Math.ceil(data.length / 15)));
      } else {
        setAlunos(data.itens);
        setTotal(data.total);
        setTotalPaginas(data.totalPaginas);
      }
    } catch {
      setErro("Erro ao carregar alunos.");
    } finally {
      setLoading(false);
    }
  }, [busca, pagina, status, turmaId]);

  useEffect(() => {
    const timer = window.setTimeout(carregarAlunos, busca ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [carregarAlunos, busca]);

  return { alunos, setAlunos, total, totalPaginas, loading, erro, setErro, carregarAlunos };
}
