import { useMemo, useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";

import { useAuth } from "../../../../contexts/useAuth";
import { useCurriculos } from "../../hooks/useCurriculos";
import { CurriculoService } from "../../services/CurriculoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { CurriculoForm } from "../../components/CurriculoForm";
import { ModuloForm } from "../../components/ModuloForm";
import { AulaCurriculoForm } from "../../components/AulaCurriculoForm";
import { TecnicaCurriculoForm } from "../../components/TecnicaCurriculoForm";
import { ModuloAccordionCard } from "../../components/ModuloAccordionCard";
import { TrilhaFaixasModulos } from "../../components/TrilhaFaixasModulos";

import { filtrarCurriculosPorBusca } from "../../utils/filtrarCurriculos";

import type {
  CurriculoFormData,
  ModuloFormData,
  AulaCurriculoFormData,
  TecnicaCurriculoFormData,
} from "../../schema/curriculo.schema";

import type { Curriculo, ModuloCurriculo, AulaCurriculo, TecnicaCurriculo } from "../../types/curriculo";

import "./styles.css";

type ModalState =
  | { tipo: "curriculo"; editando?: Curriculo }
  | { tipo: "modulo"; curriculoId: number; editando?: ModuloCurriculo }
  | { tipo: "aula"; moduloId: number; editando?: AulaCurriculo }
  | { tipo: "tecnica"; aulaCurriculoId: number; editando?: TecnicaCurriculo }
  | null;

type ExcluindoAlvo = { tipo: "curriculo" | "modulo" | "aula" | "tecnica"; id: number } | null;

interface ConfirmacaoExclusao {
  tipo: "curriculo" | "modulo" | "aula" | "tecnica";
  id: number;
  mensagem: string;
  executar: () => Promise<void>;
}

export function Curriculos() {
  const { usuario } = useAuth();
  const { curriculos, loading, erro, setErro, carregarCurriculos } = useCurriculos();
  const [modal, setModal] = useState<ModalState>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<ExcluindoAlvo>(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<ConfirmacaoExclusao | null>(null);
  const [busca, setBusca] = useState("");
  const [modulosAbertos, setModulosAbertos] = useState<Record<number, boolean>>({});
  const [aulasAbertas, setAulasAbertas] = useState<Record<number, boolean>>({});

  const ehAdmin = usuario?.perfil === "ADMIN";
  const buscaAtiva = busca.trim().length > 0;

  function estaExcluindo(tipo: NonNullable<ExcluindoAlvo>["tipo"], id: number) {
    return excluindo?.tipo === tipo && excluindo.id === id;
  }

  function moduloEstaExpandido(id: number) {
    return buscaAtiva ? true : modulosAbertos[id] ?? false;
  }

  function aulaEstaExpandida(id: number) {
    return buscaAtiva ? true : aulasAbertas[id] ?? false;
  }

  function alternarModulo(id: number) {
    setModulosAbertos((atual) => ({ ...atual, [id]: !(atual[id] ?? false) }));
  }

  function alternarAula(id: number) {
    setAulasAbertas((atual) => ({ ...atual, [id]: !(atual[id] ?? false) }));
  }

  function expandirTudo() {
    const modulosMap: Record<number, boolean> = {};
    const aulasMap: Record<number, boolean> = {};

    for (const curriculo of curriculos) {
      for (const modulo of curriculo.modulos) {
        modulosMap[modulo.id] = true;
        for (const aula of modulo.aulas) {
          aulasMap[aula.id] = true;
        }
      }
    }

    setModulosAbertos(modulosMap);
    setAulasAbertas(aulasMap);
  }

  function recolherTudo() {
    setModulosAbertos({});
    setAulasAbertas({});
  }

  const resumo = useMemo(() => {
    let totalModulos = 0;
    let totalAulas = 0;
    let totalTecnicas = 0;

    for (const curriculo of curriculos) {
      totalModulos += curriculo.modulos.length;
      for (const modulo of curriculo.modulos) {
        totalAulas += modulo.aulas.length;
        for (const aula of modulo.aulas) {
          totalTecnicas += aula.tecnicas.length;
        }
      }
    }

    return {
      totalCurriculos: curriculos.length,
      totalModulos,
      totalAulas,
      totalTecnicas,
    };
  }, [curriculos]);

  const curriculosExibidos = useMemo(
    () => filtrarCurriculosPorBusca(curriculos, busca),
    [curriculos, busca]
  );

  async function handleSalvarCurriculo(data: CurriculoFormData, editando?: Curriculo) {
    try {
      setSalvando(true);
      setErro("");
      if (editando) {
        await CurriculoService.atualizar(editando.id, data);
      } else {
        await CurriculoService.criar(data);
      }
      await carregarCurriculos();
      setModal(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar currículo."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarModulo(data: ModuloFormData, curriculoId: number, editando?: ModuloCurriculo) {
    try {
      setSalvando(true);
      setErro("");
      if (editando) {
        await CurriculoService.atualizarModulo(editando.id, data);
      } else {
        await CurriculoService.criarModulo({ ...data, curriculoId });
      }
      await carregarCurriculos();
      setModal(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar módulo."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarAula(data: AulaCurriculoFormData, moduloId: number, editando?: AulaCurriculo) {
    try {
      setSalvando(true);
      setErro("");
      const payload = {
        ...data,
        duracaoMinutos: data.duracaoMinutos ? Number(data.duracaoMinutos) : undefined,
      };
      if (editando) {
        await CurriculoService.atualizarAula(editando.id, payload);
      } else {
        await CurriculoService.criarAula({ ...payload, moduloId });
      }
      await carregarCurriculos();
      setModal(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar aula."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarTecnica(data: TecnicaCurriculoFormData, aulaCurriculoId: number, editando?: TecnicaCurriculo) {
    try {
      setSalvando(true);
      setErro("");
      if (editando) {
        await CurriculoService.atualizarTecnica(editando.id, data);
      } else {
        await CurriculoService.criarTecnica({ ...data, aulaCurriculoId });
      }
      await carregarCurriculos();
      setModal(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar técnica."));
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluirCurriculo(curriculo: Curriculo) {
    setConfirmacaoExclusao({
      tipo: "curriculo",
      id: curriculo.id,
      mensagem: `Excluir o currículo "${curriculo.nome}"? Todos os módulos, aulas e técnicas dele também serão apagados. Essa ação não pode ser desfeita.`,
      executar: async () => {
        try {
          setExcluindo({ tipo: "curriculo", id: curriculo.id });
          setErro("");
          await CurriculoService.excluir(curriculo.id);
          await carregarCurriculos();
        } catch (error) {
          setErro(getApiErrorMessage(error, "Erro ao excluir currículo."));
        } finally {
          setExcluindo(null);
        }
      },
    });
  }

  function handleExcluirModulo(modulo: ModuloCurriculo) {
    setConfirmacaoExclusao({
      tipo: "modulo",
      id: modulo.id,
      mensagem: `Excluir o módulo "${modulo.nome}"? Todas as aulas e técnicas dele também serão apagadas. Essa ação não pode ser desfeita.`,
      executar: async () => {
        try {
          setExcluindo({ tipo: "modulo", id: modulo.id });
          setErro("");
          await CurriculoService.excluirModulo(modulo.id);
          await carregarCurriculos();
        } catch (error) {
          setErro(getApiErrorMessage(error, "Erro ao excluir módulo."));
        } finally {
          setExcluindo(null);
        }
      },
    });
  }

  function handleExcluirAula(aula: AulaCurriculo) {
    setConfirmacaoExclusao({
      tipo: "aula",
      id: aula.id,
      mensagem: `Excluir a aula "${aula.titulo}"? As técnicas dela também serão apagadas. Essa ação não pode ser desfeita.`,
      executar: async () => {
        try {
          setExcluindo({ tipo: "aula", id: aula.id });
          setErro("");
          await CurriculoService.excluirAula(aula.id);
          await carregarCurriculos();
        } catch (error) {
          setErro(getApiErrorMessage(error, "Erro ao excluir aula."));
        } finally {
          setExcluindo(null);
        }
      },
    });
  }

  function handleExcluirTecnica(tecnica: TecnicaCurriculo) {
    setConfirmacaoExclusao({
      tipo: "tecnica",
      id: tecnica.id,
      mensagem: `Excluir a técnica "${tecnica.nome}"? Essa ação não pode ser desfeita.`,
      executar: async () => {
        try {
          setExcluindo({ tipo: "tecnica", id: tecnica.id });
          setErro("");
          await CurriculoService.excluirTecnica(tecnica.id);
          await carregarCurriculos();
        } catch (error) {
          setErro(getApiErrorMessage(error, "Erro ao excluir técnica."));
        } finally {
          setExcluindo(null);
        }
      },
    });
  }

  async function confirmarExclusao() {
    if (!confirmacaoExclusao) return;
    await confirmacaoExclusao.executar();
    setConfirmacaoExclusao(null);
  }

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Planejamento Pedagógico"
        subtitle="Currículo, módulos, aulas planejadas, técnicas sugeridas e jogos."
      />

      <ErrorMessage message={erro} />

      {curriculos.length > 0 && (
        <div className="curriculos-resumo">
          <div className="curriculos-resumo-card">
            <span className="curriculos-resumo-valor">{resumo.totalCurriculos}</span>
            <span className="curriculos-resumo-label">Currículo{resumo.totalCurriculos === 1 ? "" : "s"}</span>
          </div>
          <div className="curriculos-resumo-card">
            <span className="curriculos-resumo-valor">{resumo.totalModulos}</span>
            <span className="curriculos-resumo-label">Módulo{resumo.totalModulos === 1 ? "" : "s"}</span>
          </div>
          <div className="curriculos-resumo-card">
            <span className="curriculos-resumo-valor">{resumo.totalAulas}</span>
            <span className="curriculos-resumo-label">Aula{resumo.totalAulas === 1 ? "" : "s"} planejada{resumo.totalAulas === 1 ? "" : "s"}</span>
          </div>
          <div className="curriculos-resumo-card">
            <span className="curriculos-resumo-valor">{resumo.totalTecnicas}</span>
            <span className="curriculos-resumo-label">Técnica{resumo.totalTecnicas === 1 ? "" : "s"}</span>
          </div>
        </div>
      )}

      <div className="curriculos-barra-ferramentas">
        <Input
          placeholder="Buscar módulo, aula ou técnica..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="curriculos-barra-acoes">
          <Button type="button" variant="secondary" onClick={expandirTudo}>
            Expandir tudo
          </Button>
          <Button type="button" variant="secondary" onClick={recolherTudo}>
            Recolher tudo
          </Button>
        </div>
      </div>

      <div className="curriculos-acoes">
        <Button type="button" onClick={() => setModal({ tipo: "curriculo" })}>
          + Novo Currículo
        </Button>
      </div>

      {curriculos.length === 0 ? (
        <EmptyState
          title="Nenhum currículo cadastrado"
          description="Cadastre o primeiro currículo pedagógico."
        />
      ) : curriculosExibidos.length === 0 ? (
        <EmptyState
          title="Nenhum resultado encontrado"
          description="Ajuste os termos da busca."
        />
      ) : (
        curriculosExibidos.map((curriculo) => (
          <div key={curriculo.id} className="curriculo-card">
            <div className="curriculo-card-header">
              <div>
                <h2>{curriculo.nome}</h2>
                <p>{curriculo.modalidade?.nome ?? "Sem modalidade"} — {curriculo.publico}</p>
              </div>

              <div className="curriculos-card-acoes">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModal({ tipo: "curriculo", editando: curriculo })}
                >
                  Editar
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModal({ tipo: "modulo", curriculoId: curriculo.id })}
                >
                  + Módulo
                </Button>

                {ehAdmin && (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={estaExcluindo("curriculo", curriculo.id)}
                    onClick={() => handleExcluirCurriculo(curriculo)}
                  >
                    {estaExcluindo("curriculo", curriculo.id) ? "Excluindo..." : "Excluir"}
                  </Button>
                )}
              </div>
            </div>

            <TrilhaFaixasModulos modulos={curriculo.modulos} />

            {curriculo.modulos.length === 0 ? (
              <p className="curriculos-vazio">Nenhum módulo cadastrado.</p>
            ) : (
              curriculo.modulos.map((modulo) => (
                <ModuloAccordionCard
                  key={modulo.id}
                  modulo={modulo}
                  expandido={moduloEstaExpandido(modulo.id)}
                  onToggle={() => alternarModulo(modulo.id)}
                  ehAdmin={ehAdmin}
                  onEditar={() => setModal({ tipo: "modulo", curriculoId: curriculo.id, editando: modulo })}
                  onNovaAula={() => setModal({ tipo: "aula", moduloId: modulo.id })}
                  onExcluir={() => handleExcluirModulo(modulo)}
                  excluindo={estaExcluindo("modulo", modulo.id)}
                  aulaEstaExpandida={aulaEstaExpandida}
                  onToggleAula={alternarAula}
                  onEditarAula={(aula) => setModal({ tipo: "aula", moduloId: modulo.id, editando: aula })}
                  onNovaTecnica={(aula) => setModal({ tipo: "tecnica", aulaCurriculoId: aula.id })}
                  onExcluirAula={handleExcluirAula}
                  aulaEstaExcluindo={(id) => estaExcluindo("aula", id)}
                  onEditarTecnica={(aula, tecnica) =>
                    setModal({ tipo: "tecnica", aulaCurriculoId: aula.id, editando: tecnica })
                  }
                  onExcluirTecnica={handleExcluirTecnica}
                  tecnicaEstaExcluindo={(id) => estaExcluindo("tecnica", id)}
                />
              ))
            )}
          </div>
        ))
      )}

      <Modal
        open={modal?.tipo === "curriculo"}
        title={modal?.tipo === "curriculo" && modal.editando ? "Editar Currículo" : "Novo Currículo"}
        onClose={() => setModal(null)}
      >
        <CurriculoForm
          loading={salvando}
          initialValues={
            modal?.tipo === "curriculo" && modal.editando
              ? {
                  nome: modal.editando.nome,
                  descricao: modal.editando.descricao ?? "",
                  modalidadeId: modal.editando.modalidadeId ? String(modal.editando.modalidadeId) : "",
                  publico: modal.editando.publico,
                }
              : undefined
          }
          onSubmit={(data) => modal?.tipo === "curriculo" && handleSalvarCurriculo(data, modal.editando)}
        />
      </Modal>

      <Modal
        open={modal?.tipo === "modulo"}
        title={modal?.tipo === "modulo" && modal.editando ? "Editar Módulo" : "Novo Módulo"}
        onClose={() => setModal(null)}
      >
        <ModuloForm
          loading={salvando}
          initialValues={
            modal?.tipo === "modulo" && modal.editando
              ? {
                  nome: modal.editando.nome,
                  descricao: modal.editando.descricao ?? "",
                  faixa: modal.editando.faixa ?? "",
                }
              : undefined
          }
          onSubmit={(data) =>
            modal?.tipo === "modulo" && handleSalvarModulo(data, modal.curriculoId, modal.editando)
          }
        />
      </Modal>

      <Modal
        open={modal?.tipo === "aula"}
        title={modal?.tipo === "aula" && modal.editando ? "Editar Aula Planejada" : "Nova Aula Planejada"}
        onClose={() => setModal(null)}
      >
        <AulaCurriculoForm
          loading={salvando}
          initialValues={
            modal?.tipo === "aula" && modal.editando
              ? {
                  titulo: modal.editando.titulo,
                  objetivo: modal.editando.objetivo ?? "",
                  descricao: modal.editando.descricao ?? "",
                  jogosSugeridos: modal.editando.jogosSugeridos ?? "",
                  duracaoMinutos:
                    modal.editando.duracaoMinutos != null ? String(modal.editando.duracaoMinutos) : "",
                }
              : undefined
          }
          onSubmit={(data) => modal?.tipo === "aula" && handleSalvarAula(data, modal.moduloId, modal.editando)}
        />
      </Modal>

      <Modal
        open={modal?.tipo === "tecnica"}
        title={modal?.tipo === "tecnica" && modal.editando ? "Editar Técnica" : "Nova Técnica Sugerida"}
        onClose={() => setModal(null)}
      >
        <TecnicaCurriculoForm
          loading={salvando}
          initialValues={
            modal?.tipo === "tecnica" && modal.editando
              ? {
                  nome: modal.editando.nome,
                  categoria: modal.editando.categoria ?? "",
                  descricao: modal.editando.descricao ?? "",
                  obrigatoria: modal.editando.obrigatoria,
                }
              : undefined
          }
          onSubmit={(data) =>
            modal?.tipo === "tecnica" && handleSalvarTecnica(data, modal.aulaCurriculoId, modal.editando)
          }
        />
      </Modal>

      <ConfirmDialog
        open={confirmacaoExclusao !== null}
        title="Excluir"
        message={confirmacaoExclusao?.mensagem ?? ""}
        confirmLabel="Excluir"
        loading={confirmacaoExclusao !== null && estaExcluindo(confirmacaoExclusao.tipo, confirmacaoExclusao.id)}
        onConfirm={confirmarExclusao}
        onCancel={() => setConfirmacaoExclusao(null)}
      />
    </Layout>
  );
}
