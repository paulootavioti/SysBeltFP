import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

import type { Aluno } from "../../alunos/types";
import { AlunoService } from "../../alunos/services/AlunoService";

import "./RelatorioCard.css";

interface RelatorioCardProps {
  titulo: string;
  descricao: string;
  requerAluno?: boolean;
  aoGerar: (alunoId?: number) => Promise<string>;
}

export function RelatorioCard({
  titulo,
  descricao,
  requerAluno = false,
  aoGerar,
}: RelatorioCardProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoId, setAlunoId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!requerAluno) return;

    AlunoService.listar().then((data) =>
      setAlunos(data.filter((a) => a.ativo))
    );
  }, [requerAluno]);

  async function handleGerar() {
    try {
      setCarregando(true);
      setErro("");
      setCopiado(false);
      const texto = await aoGerar(requerAluno ? Number(alunoId) : undefined);
      setMensagem(texto);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao gerar relatório."));
    } finally {
      setCarregando(false);
    }
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(mensagem);
    setCopiado(true);
  }

  return (
    <div className="relatorio-card">
      <h3>{titulo}</h3>
      <p>{descricao}</p>

      {requerAluno && (
        <Select
          label="Aluno"
          options={alunos.map((aluno) => ({ label: aluno.nome, value: String(aluno.id) }))}
          value={alunoId}
          onChange={(e) => setAlunoId(e.target.value)}
        />
      )}

      <Button
        type="button"
        onClick={handleGerar}
        disabled={carregando || (requerAluno && !alunoId)}
      >
        {carregando ? "Gerando..." : "Gerar Relatório"}
      </Button>

      <ErrorMessage message={erro} />

      {mensagem && (
        <>
          <pre className="relatorio-card-mensagem">{mensagem}</pre>
          <Button type="button" variant="secondary" onClick={handleCopiar}>
            {copiado ? "Copiado!" : "Copiar"}
          </Button>
        </>
      )}
    </div>
  );
}