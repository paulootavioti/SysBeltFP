import { useEffect, useState } from "react";
import type { Aluno } from "../types";
import { AlunoService } from "../services/AlunoService";

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarAlunos() {
    try {
      setLoading(true);

      const data = await AlunoService.listar();

      setAlunos(data);
    } catch {
      setErro("Erro ao carregar alunos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAlunos();
  }, []);

  return {
    alunos,
    setAlunos,
    loading,
    erro,
    setErro,
    carregarAlunos,
  };
}