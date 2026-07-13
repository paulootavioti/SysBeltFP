import { useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Modal } from "../../../../components/ui/Modal";
import { Badge } from "../../../../components/ui/Badge";

import { useCurriculos } from "../../hooks/useCurriculos";
import { CurriculoService } from "../../services/CurriculoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { CurriculoForm } from "../../components/CurriculoForm";
import { ModuloForm } from "../../components/ModuloForm";
import { AulaCurriculoForm } from "../../components/AulaCurriculoForm";
import { TecnicaCurriculoForm } from "../../components/TecnicaCurriculoForm";

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

export function Curriculos() {
  const { curriculos, loading, erro, setErro, carregarCurriculos } = useCurriculos();
  const [modal, setModal] = useState<ModalState>(null);
  const [salvando, setSalvando] = useState(false);

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
      ) : (
        curriculos.map((curriculo) => (
          <div key={curriculo.id} className="curriculo-card">
            <div className="curriculo-card-header">
              <div>
                <h2>{curriculo.nome}</h2>
                <p>{curriculo.modalidade} — {curriculo.publico}</p>
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
              </div>
            </div>

            {curriculo.modulos.length === 0 ? (
              <p className="curriculos-vazio">Nenhum módulo cadastrado.</p>
            ) : (
              curriculo.modulos.map((modulo) => (
                <div key={modulo.id} className="modulo-card">
                  <div className="modulo-card-header">
                    <div>
                      <h3>{modulo.nome}</h3>
                      {modulo.faixa && <span className="modulo-faixa">{modulo.faixa}</span>}
                    </div>

                    <div className="curriculos-card-acoes">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setModal({ tipo: "modulo", curriculoId: curriculo.id, editando: modulo })}
                      >
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setModal({ tipo: "aula", moduloId: modulo.id })}
                      >
                        + Aula
                      </Button>
                    </div>
                  </div>

                  {modulo.aulas.length === 0 ? (
                    <p className="curriculos-vazio">Nenhuma aula planejada.</p>
                  ) : (
                    modulo.aulas.map((aula) => (
                      <div key={aula.id} className="aula-curriculo-card">
                        <div className="aula-curriculo-header">
                          <div>
                            <h4>{aula.titulo}</h4>
                            {aula.objetivo && <p>🎯 {aula.objetivo}</p>}
                            {aula.duracaoMinutos && <p>⏱ {aula.duracaoMinutos} min</p>}
                            {aula.jogosSugeridos && <p>🎮 {aula.jogosSugeridos}</p>}
                          </div>

                          <div className="curriculos-card-acoes">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setModal({ tipo: "aula", moduloId: modulo.id, editando: aula })}
                            >
                              Editar
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setModal({ tipo: "tecnica", aulaCurriculoId: aula.id })}
                            >
                              + Técnica
                            </Button>
                          </div>
                        </div>

                        {aula.tecnicas.length > 0 && (
                          <div className="tecnicas-lista">
                            {aula.tecnicas.map((tecnica) => (
                              <button
                                key={tecnica.id}
                                type="button"
                                className="tecnica-badge-botao"
                                title="Clique para editar"
                                onClick={() =>
                                  setModal({ tipo: "tecnica", aulaCurriculoId: aula.id, editando: tecnica })
                                }
                              >
                                <Badge variant={tecnica.obrigatoria ? "info" : "neutral"}>
                                  {tecnica.nome}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
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
                  modalidade: modal.editando.modalidade,
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
    </Layout>
  );
}