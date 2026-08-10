import { useState } from "react";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { useToast } from "../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { PlataformaService } from "../services/PlataformaService";
import {
  RECURSO_LABEL,
  centavosParaReais,
  formatarCentavos,
  reaisParaCentavos,
  type PlanoPlataforma,
  type RecursoPlataforma,
} from "../types";

const RECURSOS = Object.keys(RECURSO_LABEL) as RecursoPlataforma[];

interface PlanosDaPlataformaProps {
  planos: PlanoPlataforma[];
  onAtualizado: () => Promise<void>;
}

export function PlanosDaPlataforma({ planos, onAtualizado }: PlanosDaPlataformaProps) {
  const toast = useToast();
  const [editando, setEditando] = useState<PlanoPlataforma | null>(null);
  const [criando, setCriando] = useState(false);

  const emEdicao = criando || !!editando;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [alunosPorBloco, setAlunosPorBloco] = useState("10");
  const [preco, setPreco] = useState("37,00");
  const [recursos, setRecursos] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  function abrirNovo() {
    setEditando(null);
    setCriando(true);
    setNome("");
    setDescricao("");
    setAlunosPorBloco("10");
    setPreco("37,00");
    setRecursos([]);
  }

  function abrirEdicao(plano: PlanoPlataforma) {
    setCriando(false);
    setEditando(plano);
    setNome(plano.nome);
    setDescricao(plano.descricao ?? "");
    setAlunosPorBloco(String(plano.alunosPorBloco));
    setPreco(centavosParaReais(plano.precoPorBlocoCentavos));
    setRecursos(plano.recursos);
  }

  async function salvar() {
    const centavos = reaisParaCentavos(preco);

    if (!nome.trim()) return toast.error("Informe o nome do plano.");
    if (!Number.isFinite(centavos) || centavos < 100) {
      return toast.error("Preço inválido. O mínimo é R$ 1,00 por faixa.");
    }

    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      alunosPorBloco: Number(alunosPorBloco),
      precoPorBlocoCentavos: centavos,
      recursos,
    };

    try {
      setSalvando(true);

      if (editando) {
        await PlataformaService.editarPlano(editando.id, dados);
        toast.success("Plano atualizado.");
      } else {
        await PlataformaService.criarPlano(dados);
        toast.success("Plano criado.");
      }

      setCriando(false);
      setEditando(null);
      await onAtualizado();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar o plano."));
    } finally {
      setSalvando(false);
    }
  }

  function alternarRecurso(recurso: string) {
    setRecursos((atuais) =>
      atuais.includes(recurso) ? atuais.filter((r) => r !== recurso) : [...atuais, recurso]
    );
  }

  return (
    <div>
      {!emEdicao && (
        <>
          <ul className="planos-lista">
            {planos.map((plano) => (
              <li key={plano.id} className={plano.ativo ? "" : "planos-item--inativo"}>
                <div>
                  <strong>{plano.nome}</strong>
                  {!plano.ativo && <span className="planos-etiqueta">não ofertado</span>}
                  <p className="plataforma-ajuda">
                    {formatarCentavos(plano.precoPorBlocoCentavos)} a cada {plano.alunosPorBloco}{" "}
                    alunos
                    {plano.recursos.length > 0 &&
                      ` · ${plano.recursos
                        .map((r) => RECURSO_LABEL[r as RecursoPlataforma] ?? r)
                        .join(", ")}`}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => abrirEdicao(plano)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>

          <Button onClick={abrirNovo}>+ Novo plano</Button>
        </>
      )}

      {emEdicao && (
        <>
          <FormGrid columns={2}>
            <FormGridItem span={2}>
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </FormGridItem>

            <FormGridItem span={2}>
              <Input
                label="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </FormGridItem>

            <FormGridItem>
              <Input
                label="Alunos por faixa"
                type="number"
                min={1}
                value={alunosPorBloco}
                onChange={(e) => setAlunosPorBloco(e.target.value)}
              />
            </FormGridItem>

            <FormGridItem>
              <Input
                label="Preço por faixa (R$)"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
              <p className="plataforma-ajuda">
                Cobrança: {formatarCentavos(reaisParaCentavos(preco) || 0)} a cada{" "}
                {alunosPorBloco} alunos ativos.
              </p>
            </FormGridItem>

            <FormGridItem span={2}>
              <span className="planos-rotulo">Recursos incluídos</span>
              {RECURSOS.map((recurso) => (
                <label key={recurso} className="planos-recurso">
                  <input
                    type="checkbox"
                    checked={recursos.includes(recurso)}
                    onChange={() => alternarRecurso(recurso)}
                  />
                  {RECURSO_LABEL[recurso]}
                </label>
              ))}
              <p className="plataforma-ajuda">
                O que estiver desmarcado fica bloqueado para quem assinar este
                plano — é assim que o WhatsApp vira premium.
              </p>
            </FormGridItem>
          </FormGrid>

          <div className="planos-acoes">
            <Button disabled={salvando} onClick={salvar}>
              {salvando ? "Salvando..." : editando ? "Salvar plano" : "Criar plano"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCriando(false);
                setEditando(null);
              }}
            >
              Voltar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
