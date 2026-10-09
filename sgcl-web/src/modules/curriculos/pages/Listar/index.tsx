import { useEffect, useMemo, useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";

import { useAuth } from "../../../../contexts/useAuth";
import { useCurriculos } from "../../hooks/useCurriculos";
import { CurriculoService } from "../../services/CurriculoService";
import type { ItemCatalogoPedagogicoPayload } from "../../services/CurriculoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { CurriculoForm } from "../../components/CurriculoForm";
import { ModuloForm } from "../../components/ModuloForm";
import { AulaCurriculoForm } from "../../components/AulaCurriculoForm";
import { TecnicaCurriculoForm } from "../../components/TecnicaCurriculoForm";
import { MemorandoPedagogico } from "../../components/MemorandoPedagogico";
import { ModuloAccordionCard } from "../../components/ModuloAccordionCard";
import { TrilhaFaixasModulos } from "../../components/TrilhaFaixasModulos";

import { filtrarCurriculosPorBusca } from "../../utils/filtrarCurriculos";
import { duracaoDoBlocoEmSegundos } from "../../utils/duracaoBlocos";
import { perfilTemAcesso } from "../../../../shared/constants/acessoPorPerfil";

import type {
  CurriculoFormData,
  ModuloFormData,
  AulaCurriculoFormData,
  TecnicaCurriculoFormData,
} from "../../schema/curriculo.schema";

import type { ConteudoBiblioteca, Curriculo, ModuloCurriculo, AulaCurriculo, TecnicaCurriculo, ItemCatalogoPedagogico, TemplatePlanejamento } from "../../types/curriculo";

import "./styles.css";

type ModalState =
  | { tipo: "curriculo"; editando?: Curriculo }
  | { tipo: "modulo"; curriculoId: number; editando?: ModuloCurriculo }
  | { tipo: "aula"; moduloId: number; editando?: AulaCurriculo }
  | { tipo: "novaAula"; moduloId: number; modalidadeLocalId?: number }
  | { tipo: "assistida"; moduloId: number; modalidadeLocalId?: number }
  | { tipo: "tecnica"; aulaCurriculoId: number; editando?: TecnicaCurriculo }
  | { tipo: "catalogo" }
  | { tipo: "biblioteca" }
  | { tipo: "novoConteudo" }
  | { tipo: "importarMatriz" }
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
  const [itensCatalogo, setItensCatalogo] = useState<ItemCatalogoPedagogico[]>([]);
  const [conteudosBiblioteca, setConteudosBiblioteca] = useState<ConteudoBiblioteca[]>([]);
  const [templatesPlanejamento, setTemplatesPlanejamento] = useState<TemplatePlanejamento[]>([]);
  const [novoItemCatalogo, setNovoItemCatalogo] = useState({ tipo: "POSICAO", nome: "", tipoBloco: "TECNICA", descricao: "", atencoesFaixaEtaria: "", duracaoMinutos: "5" });
  const [buscaBiblioteca, setBuscaBiblioteca] = useState("");
  const [conteudosAssistidos, setConteudosAssistidos] = useState<ConteudoBiblioteca[]>([]);
  const [buscaAssistida, setBuscaAssistida] = useState("");
  const [tituloAssistido, setTituloAssistido] = useState("");
  const [templateAssistidoId, setTemplateAssistidoId] = useState("");
  const [selecionadosAssistidos, setSelecionadosAssistidos] = useState<number[]>([]);
  const [modalidadesBiblioteca, setModalidadesBiblioteca] = useState<Array<{ id: number; nome: string }>>([]);
  const [novoConteudo, setNovoConteudo] = useState({ modalidadeId: "", tipo: "TECNICA", nome: "", descricao: "", passoAPasso: "", pontosAtencao: "", cuidados: "", faixaEtariaMinima: "", faixaEtariaMaxima: "", duracaoMinutos: "5" });
  const [arquivoImportacao, setArquivoImportacao] = useState<File | null>(null);
  const [conteudoParaExcluir, setConteudoParaExcluir] = useState<ConteudoBiblioteca | null>(null);

  const ehAdmin = perfilTemAcesso(usuario?.perfil, "/dashboard");
  const buscaAtiva = busca.trim().length > 0;

  async function carregarCatalogoPedagogico() {
    try { setItensCatalogo(await CurriculoService.listarCatalogoPedagogico()); } catch { setErro("Erro ao carregar o catálogo pedagógico."); }
  }

  useEffect(() => { void carregarCatalogoPedagogico(); }, []);
  useEffect(() => {
    void Promise.all([CurriculoService.listarConteudosBiblioteca(), CurriculoService.listarTemplatesPlanejamento(), CurriculoService.listarModalidadesBiblioteca()])
      .then(([conteudos, templates, modalidades]) => { setConteudosBiblioteca(conteudos); setTemplatesPlanejamento(templates); setModalidadesBiblioteca(modalidades); })
      .catch(() => setErro("Erro ao carregar a biblioteca pedagógica."));
  }, [setErro]);

  useEffect(() => {
    if (modal?.tipo !== "assistida") return;
    void CurriculoService.pesquisarConteudosBiblioteca({ busca: buscaAssistida, modalidadeLocalId: modal.modalidadeLocalId })
      .then((resposta) => setConteudosAssistidos(resposta.itens))
      .catch(() => setErro("Não foi possível carregar conteúdos para esta modalidade."));
  }, [modal, buscaAssistida, setErro]);

  useEffect(() => {
    if (modal?.tipo !== "biblioteca") return;
    void CurriculoService.pesquisarConteudosBiblioteca({ busca: buscaBiblioteca })
      .then((resposta) => setConteudosBiblioteca(resposta.itens))
      .catch(() => setErro("Não foi possível pesquisar a biblioteca pedagógica."));
  }, [modal?.tipo, buscaBiblioteca, setErro]);

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

  async function handleExportarMatriz(formato: "csv" | "xls" | "pdf") {
    try {
      setErro("");
      const arquivo = await CurriculoService.exportarMatriz(formato);
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = `matriz-planejamentos.${formato}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao exportar a matriz de planejamentos."));
    }
  }

  async function handleImportarMatriz() {
    if (!arquivoImportacao) {
      setErro("Selecione um arquivo de matriz para importar.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      const resultado = await CurriculoService.importarArquivoMatriz(arquivoImportacao);
      await carregarCurriculos();
      setArquivoImportacao(null);
      setModal(null);
      if (resultado.avisos.length) setErro(resultado.avisos.join(" "));
    } catch (error) {
      setErro(error instanceof SyntaxError ? "O arquivo selecionado não contém um JSON válido." : getApiErrorMessage(error, "Não foi possível importar a matriz de planejamentos."));
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
        blocos: (data.blocos ?? []).map((bloco, ordem) => ({
          tipo: bloco.tipo,
          nome: bloco.nome,
          ordem,
          duracaoPrevistaSegundos: duracaoDoBlocoEmSegundos(bloco),
          rounds: bloco.tipo === "SPARRING" ? Number(bloco.rounds || 4) : undefined,
          duracaoRoundSegundos: bloco.tipo === "SPARRING" ? Number(bloco.duracaoRoundMinutos || 4) * 60 : undefined,
          descansoSegundos: bloco.tipo === "SPARRING" ? Number(bloco.descansoSegundos || 60) : undefined,
          anuncio: bloco.tipo === "PAUSA" ? bloco.anuncio || undefined : undefined,
          descricao: bloco.descricao || undefined,
          atencoesFaixaEtaria: bloco.atencoesFaixaEtaria || undefined,
          conteudoTecnicoId: bloco.conteudoTecnicoId ? Number(bloco.conteudoTecnicoId) : undefined,
        })),
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

  async function handleSalvarAulaAssistida(moduloId: number) {
    try {
      setSalvando(true);
      setErro("");
      await CurriculoService.criarAulaAssistida({
        moduloId,
        titulo: tituloAssistido,
        templateId: templateAssistidoId ? Number(templateAssistidoId) : undefined,
        conteudoIds: selecionadosAssistidos,
        substituirEtapasTecnicas: true,
      });
      await carregarCurriculos();
      setModal(null);
      setTituloAssistido("");
      setSelecionadosAssistidos([]);
      setTemplateAssistidoId("");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao criar aula assistida."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarTecnica(data: TecnicaCurriculoFormData, aulaCurriculoId: number, editando?: TecnicaCurriculo) {
    try {
      setSalvando(true);
      setErro("");
      const payload = { ...data, duracaoPrevistaSegundos: Number(data.duracaoPrevistaMinutos) * 60 };
      if (editando) {
        await CurriculoService.atualizarTecnica(editando.id, payload);
      } else {
        await CurriculoService.criarTecnica({ ...payload, aulaCurriculoId });
      }
      await carregarCurriculos();
      setModal(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar técnica."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDuplicarAula(aula: AulaCurriculo) {
    try {
      setErro("");
      await CurriculoService.duplicarAula(aula.id);
      await carregarCurriculos();
      setAulasAbertas((atual) => ({ ...atual, [aula.id]: true }));
    } catch (error) { setErro(getApiErrorMessage(error, "Erro ao duplicar planejamento.")); }
  }

  async function handleCopiarConteudo(conteudo: ConteudoBiblioteca) {
    try {
      setErro("");
      await CurriculoService.copiarConteudoBiblioteca(conteudo.id);
      const resposta = await CurriculoService.pesquisarConteudosBiblioteca({ busca: buscaBiblioteca });
      setConteudosBiblioteca(resposta.itens);
    } catch (error) { setErro(getApiErrorMessage(error, "Erro ao adicionar conteúdo à sua biblioteca.")); }
  }

  async function handleSalvarConteudo() {
    try {
      setSalvando(true);
      await CurriculoService.criarConteudoBiblioteca({
        modalidadeId: Number(novoConteudo.modalidadeId), tipo: novoConteudo.tipo, nome: novoConteudo.nome,
        descricao: novoConteudo.descricao || null, passoAPasso: novoConteudo.passoAPasso || null,
        pontosAtencao: novoConteudo.pontosAtencao || null, cuidados: novoConteudo.cuidados || null,
        faixaEtariaMinima: novoConteudo.faixaEtariaMinima ? Number(novoConteudo.faixaEtariaMinima) : null,
        faixaEtariaMaxima: novoConteudo.faixaEtariaMaxima ? Number(novoConteudo.faixaEtariaMaxima) : null,
        duracaoSugeridaSegundos: Number(novoConteudo.duracaoMinutos) * 60,
        tags: [],
      });
      const resposta = await CurriculoService.pesquisarConteudosBiblioteca({ busca: buscaBiblioteca });
      setConteudosBiblioteca(resposta.itens);
      setModal(null);
      setNovoConteudo({ modalidadeId: "", tipo: "TECNICA", nome: "", descricao: "", passoAPasso: "", pontosAtencao: "", cuidados: "", faixaEtariaMinima: "", faixaEtariaMaxima: "", duracaoMinutos: "5" });
    } catch (error) { setErro(getApiErrorMessage(error, "Erro ao cadastrar conteúdo técnico.")); }
    finally { setSalvando(false); }
  }

  async function handleExcluirConteudo(conteudo: ConteudoBiblioteca) {
    try {
      await CurriculoService.excluirConteudoBiblioteca(conteudo.id);
      setConteudosBiblioteca((atual) => atual.filter((item) => item.id !== conteudo.id));
    } catch (error) { setErro(getApiErrorMessage(error, "Erro ao remover conteúdo técnico.")); }
  }

  const saude = useMemo(() => {
    const aulas = curriculos.flatMap((curriculo) => curriculo.modulos.flatMap((modulo) => modulo.aulas));
    return {
      semEtapas: aulas.filter((aula) => aula.blocos.length === 0).length,
      acimaDuracao: aulas.filter((aula) => aula.duracaoTurmaMinutos !== null && aula.filaCompilada.duracaoTotalSegundos > aula.duracaoTurmaMinutos * 60).length,
      modulosSemAulas: curriculos.flatMap((curriculo) => curriculo.modulos).filter((modulo) => modulo.aulas.length === 0).length,
      curriculosSemTurma: curriculos.filter((curriculo) => (curriculo.totalTurmas ?? 0) === 0).length,
    };
  }, [curriculos]);

  async function handleSalvarItemCatalogo() {
    try {
      setSalvando(true);
      const payload: ItemCatalogoPedagogicoPayload = {
        tipo: novoItemCatalogo.tipo as ItemCatalogoPedagogicoPayload["tipo"],
        nome: novoItemCatalogo.nome,
        tipoBloco: novoItemCatalogo.tipo === "MOMENTO" ? novoItemCatalogo.tipoBloco as ItemCatalogoPedagogicoPayload["tipoBloco"] : "TECNICA",
        descricao: novoItemCatalogo.descricao || undefined,
        atencoesFaixaEtaria: novoItemCatalogo.atencoesFaixaEtaria || undefined,
        duracaoPrevistaSegundos: Math.max(1, Number(novoItemCatalogo.duracaoMinutos || 1)) * 60,
      };
      await CurriculoService.criarItemCatalogoPedagogico(payload);
      await carregarCatalogoPedagogico();
      setNovoItemCatalogo({ tipo: "POSICAO", nome: "", tipoBloco: "TECNICA", descricao: "", atencoesFaixaEtaria: "", duracaoMinutos: "5" });
      setModal(null);
    } catch (error) { setErro(getApiErrorMessage(error, "Erro ao cadastrar item pedagógico.")); }
    finally { setSalvando(false); }
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
        subtitle="Organize currículos, módulos e aulas com etapas cronometradas"
      />

      <ErrorMessage message={erro} />

      {curriculos.length > 0 && (
        <div className="curriculos-resumo">
          {Object.values(saude).every((valor) => valor === 0) ? <p className="curriculos-saude-ok">Tudo em ordem</p> : <>
            <Button type="button" variant="secondary" onClick={() => setBusca(" ")}>{saude.semEtapas} aulas sem etapas</Button>
            <Button type="button" variant="secondary" onClick={expandirTudo}>{saude.acimaDuracao} aulas acima da duração</Button>
            <Button type="button" variant="secondary" onClick={expandirTudo}>{saude.modulosSemAulas} módulos sem aulas</Button>
            <Button type="button" variant="secondary" onClick={() => setBusca("")}>{saude.curriculosSemTurma} currículos sem turma</Button>
          </>}
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
        <Button type="button" variant="secondary" onClick={() => setModal({ tipo: "biblioteca" })}>
          Biblioteca técnica
        </Button>
        <Button type="button" variant="secondary" onClick={() => setModal({ tipo: "catalogo" })}>
          Novo item do catálogo
        </Button>
        <Button type="button" variant="secondary" onClick={() => setModal({ tipo: "importarMatriz" })}>
          Importar CSV/XLS
        </Button>
        <Button type="button" variant="secondary" disabled={curriculos.length === 0} onClick={() => void handleExportarMatriz("csv")}>
          Exportar CSV
        </Button>
        <Button type="button" variant="secondary" disabled={curriculos.length === 0} onClick={() => void handleExportarMatriz("xls")}>
          Exportar XLS
        </Button>
        <Button type="button" variant="secondary" disabled={curriculos.length === 0} onClick={() => void handleExportarMatriz("pdf")}>
          Exportar PDF
        </Button>
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
                  onNovaAula={() => setModal({ tipo: "novaAula", moduloId: modulo.id, modalidadeLocalId: curriculo.modalidade?.id })}
                  onExcluir={() => handleExcluirModulo(modulo)}
                  excluindo={estaExcluindo("modulo", modulo.id)}
                  aulaEstaExpandida={aulaEstaExpandida}
                  onToggleAula={alternarAula}
                  onEditarAula={(aula) => setModal({ tipo: "aula", moduloId: modulo.id, editando: aula })}
                  onDuplicarAula={handleDuplicarAula}
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

      <Modal open={modal?.tipo === "importarMatriz"} title="Importar matriz de planejamentos" onClose={() => setModal(null)}>
        <form onSubmit={(event) => { event.preventDefault(); void handleImportarMatriz(); }}>
          <Input
            label="Arquivo CSV ou XLS"
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            onChange={(event) => setArquivoImportacao(event.target.files?.[0] ?? null)}
          />
          <Button type="submit" disabled={salvando || !arquivoImportacao}>
            {salvando ? "Importando..." : "Importar todos os currículos"}
          </Button>
        </form>
      </Modal>

      <Modal open={modal?.tipo === "assistida"} title="Criar aula assistida" onClose={() => setModal(null)}>
        <form onSubmit={(event) => { event.preventDefault(); if (modal?.tipo === "assistida") void handleSalvarAulaAssistida(modal.moduloId); }}>
          <Input label="Título da aula" required value={tituloAssistido} onChange={(event) => setTituloAssistido(event.target.value)} />
          <Select label="Modelo de aula" value={templateAssistidoId} options={[{ value: "", label: "Sem modelo" }, ...templatesPlanejamento.map((template) => ({ value: String(template.id), label: `${template.nome}${template.versao ? ` (v${template.versao})` : ""}` }))]} onChange={(event) => setTemplateAssistidoId(event.target.value)} />
          <Input label="Buscar conteúdo técnico" placeholder="Ex.: guarda, queda, defesa" value={buscaAssistida} onChange={(event) => setBuscaAssistida(event.target.value)} />
          <div className="biblioteca-modal">
            {conteudosAssistidos.map((conteudo) => (
              <label key={conteudo.id} className="biblioteca-conteudo-card">
                <input type="checkbox" checked={selecionadosAssistidos.includes(conteudo.id)} onChange={(event) => setSelecionadosAssistidos((atual) => event.target.checked ? [...atual, conteudo.id] : atual.filter((id) => id !== conteudo.id))} />
                <span><strong>{conteudo.nome}</strong><small>{conteudo.tipo.toLocaleLowerCase("pt-BR")} · {Math.max(1, Math.round(conteudo.duracaoSugeridaSegundos / 60))} min</small>{conteudo.descricao && <p>{conteudo.descricao}</p>}</span>
              </label>
            ))}
          </div>
          <Button type="submit" disabled={salvando || !tituloAssistido.trim() || selecionadosAssistidos.length === 0}>{salvando ? "Criando..." : "Criar roteiro"}</Button>
        </form>
      </Modal>

      <Modal open={modal?.tipo === "novaAula"} title="Nova aula" onClose={() => setModal(null)}>
        <p>Escolha um ponto de partida para montar o roteiro da aula.</p>
        <div className="curriculos-card-acoes">
          <Button type="button" onClick={() => modal?.tipo === "novaAula" && setModal({ tipo: "aula", moduloId: modal.moduloId })}>Montar do zero</Button>
          <Button type="button" variant="secondary" onClick={() => {
            if (modal?.tipo !== "novaAula") return;
            setBuscaAssistida("");
            setSelecionadosAssistidos([]);
            setModal({ tipo: "assistida", moduloId: modal.moduloId, modalidadeLocalId: modal.modalidadeLocalId });
          }}>Usar um modelo</Button>
        </div>
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
                  blocos: modal.editando.blocos.map((bloco) => ({
                    tipo: bloco.tipo,
                    nome: bloco.nome,
                    duracaoMinutos: String(Math.max(1, Math.round(bloco.duracaoPrevistaSegundos / 60))),
                    rounds: bloco.rounds ? String(bloco.rounds) : "4",
                    duracaoRoundMinutos: bloco.duracaoRoundSegundos ? String(Math.max(1, Math.round(bloco.duracaoRoundSegundos / 60))) : "4",
                    descansoSegundos: bloco.descansoSegundos != null ? String(bloco.descansoSegundos) : "60",
                    anuncio: bloco.anuncio ?? "",
                    descricao: bloco.descricao ?? "",
                    atencoesFaixaEtaria: bloco.atencoesFaixaEtaria ?? "",
                    conteudoTecnicoId: bloco.conteudoTecnicoId ? String(bloco.conteudoTecnicoId) : "",
                  })),
                }
              : undefined
          }
          itensCatalogo={itensCatalogo}
          templates={templatesPlanejamento}
          modalidadeLocalId={modal?.tipo === "aula" ? curriculos.find((curriculo) => curriculo.modulos.some((modulo) => modulo.id === modal.moduloId))?.modalidadeId ?? undefined : undefined}
          limiteMinutos={modal?.tipo === "aula" ? modal.editando?.duracaoTurmaMinutos ?? null : null}
          onSubmit={(data) => modal?.tipo === "aula" && handleSalvarAula(data, modal.moduloId, modal.editando)}
        />
      </Modal>

      <Modal open={modal?.tipo === "catalogo"} title="Novo item pedagógico" onClose={() => setModal(null)}>
        <form onSubmit={(event) => { event.preventDefault(); void handleSalvarItemCatalogo(); }}>
          <Select label="Tipo" value={novoItemCatalogo.tipo} options={[{ value: "POSICAO", label: "Posição" }, { value: "EXERCICIO", label: "Exercício" }, { value: "MOMENTO", label: "Momento" }]} onChange={(event) => setNovoItemCatalogo((atual) => ({ ...atual, tipo: event.target.value, tipoBloco: event.target.value === "MOMENTO" ? "AQUECIMENTO" : "TECNICA" }))} />
          {novoItemCatalogo.tipo === "MOMENTO" && <Select label="Etapa da aula" value={novoItemCatalogo.tipoBloco} options={[{ value: "AQUECIMENTO", label: "Aquecimento" }, { value: "JOGO", label: "Jogo" }, { value: "PAUSA", label: "Pausa" }, { value: "ALONGAMENTO", label: "Alongamento" }, { value: "SPARRING", label: "Sparring" }]} onChange={(event) => setNovoItemCatalogo((atual) => ({ ...atual, tipoBloco: event.target.value }))} />}
          <Input label="Nome" required value={novoItemCatalogo.nome} onChange={(event) => setNovoItemCatalogo((atual) => ({ ...atual, nome: event.target.value }))} />
          <Input label="Duração sugerida (min)" required type="number" min="1" value={novoItemCatalogo.duracaoMinutos} onChange={(event) => setNovoItemCatalogo((atual) => ({ ...atual, duracaoMinutos: event.target.value }))} />
          <MemorandoPedagogico label="Como conduzir" placeholder="Explique a sequência, a organização dos alunos e o critério para avançar." rows={4} value={novoItemCatalogo.descricao} onChange={(value) => setNovoItemCatalogo((atual) => ({ ...atual, descricao: value }))} sugestoes={["Demonstre a atividade e faça uma rodada curta de experimentação.", "Divida em duplas compatíveis e alterne os papéis.", "Retome o grupo para corrigir antes de aumentar a dificuldade."]} />
          <MemorandoPedagogico label="Cuidados e adaptações" placeholder="Indique intensidade, pares, espaço e adaptações para idade ou maturidade." rows={3} value={novoItemCatalogo.atencoesFaixaEtaria} onChange={(value) => setNovoItemCatalogo((atual) => ({ ...atual, atencoesFaixaEtaria: value }))} sugestoes={["Mantenha espaço livre e intensidade baixa para crianças menores.", "Evite diferença grande de tamanho ou experiência entre os pares.", "Ofereça uma variação mais simples quando houver insegurança."]} />
          <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Cadastrar item"}</Button>
        </form>
      </Modal>

      <Modal open={modal?.tipo === "biblioteca"} title="Biblioteca técnica" onClose={() => setModal(null)}>
        <div className="biblioteca-modal">
          <Button type="button" onClick={() => setModal({ tipo: "novoConteudo" })}>Novo conteúdo</Button>
          <Input label="Buscar conteúdo" placeholder="Ex.: guarda, queda, defesa" value={buscaBiblioteca} onChange={(event) => setBuscaBiblioteca(event.target.value)} />
          {conteudosBiblioteca.map((conteudo) => (
            <article key={conteudo.id} className="biblioteca-conteudo-card">
              <div><strong>{conteudo.nome}</strong><small>{conteudo.modalidade.nome} · {conteudo.tipo.toLocaleLowerCase("pt-BR")} · {conteudo.nivelDificuldade.toLocaleLowerCase("pt-BR")}</small>{conteudo.descricao && <p>{conteudo.descricao}</p>}</div>
              {conteudo.unidadeId === null && <Button type="button" variant="secondary" onClick={() => void handleCopiarConteudo(conteudo)}>Adicionar à minha biblioteca</Button>}
              {conteudo.unidadeId !== null && <Button type="button" variant="danger" onClick={() => setConteudoParaExcluir(conteudo)}>Remover</Button>}
            </article>
          ))}
        </div>
      </Modal>

      <Modal open={modal?.tipo === "novoConteudo"} title="Novo conteúdo técnico" onClose={() => setModal({ tipo: "biblioteca" })}>
        <form onSubmit={(event) => { event.preventDefault(); void handleSalvarConteudo(); }}>
          <Select label="Modalidade" value={novoConteudo.modalidadeId} options={[{ value: "", label: "Selecione" }, ...modalidadesBiblioteca.map((modalidade) => ({ value: String(modalidade.id), label: modalidade.nome }))]} onChange={(event) => setNovoConteudo((atual) => ({ ...atual, modalidadeId: event.target.value }))} />
          <Select label="Tipo" value={novoConteudo.tipo} options={[{ value: "TECNICA", label: "Técnica" }, { value: "POSICAO", label: "Posição" }, { value: "EXERCICIO", label: "Exercício" }, { value: "AQUECIMENTO", label: "Aquecimento" }, { value: "DRILL", label: "Drill" }]} onChange={(event) => setNovoConteudo((atual) => ({ ...atual, tipo: event.target.value }))} />
          <Input label="Nome" required value={novoConteudo.nome} onChange={(event) => setNovoConteudo((atual) => ({ ...atual, nome: event.target.value }))} />
          <Input label="Duração sugerida (min)" required type="number" min="1" value={novoConteudo.duracaoMinutos} onChange={(event) => setNovoConteudo((atual) => ({ ...atual, duracaoMinutos: event.target.value }))} />
          <MemorandoPedagogico label="Objetivo pedagógico" placeholder="O que o aluno deve compreender ou desenvolver com este conteúdo." value={novoConteudo.descricao} onChange={(value) => setNovoConteudo((atual) => ({ ...atual, descricao: value }))} sugestoes={["Desenvolver controle corporal e percepção de base.", "Compreender a sequência antes de aplicar em dupla.", "Reconhecer o momento seguro para iniciar e finalizar o movimento."]} />
          <MemorandoPedagogico label="Como executar" placeholder="Descreva a posição inicial, a sequência e a conclusão da atividade." rows={4} value={novoConteudo.passoAPasso} onChange={(value) => setNovoConteudo((atual) => ({ ...atual, passoAPasso: value }))} sugestoes={["Apresente a posição inicial e os pontos de contato.", "Demonstre a sequência em velocidade lenta e depois em ritmo normal.", "Finalize mostrando a posição de segurança e a saída da atividade."]} />
          <MemorandoPedagogico label="Pontos de atenção do professor" placeholder="Sinais para corrigir, erros comuns e onde observar a turma." value={novoConteudo.pontosAtencao} onChange={(value) => setNovoConteudo((atual) => ({ ...atual, pontosAtencao: value }))} sugestoes={["Observe alinhamento, base e distribuição de peso.", "Corrija um detalhe por vez para não sobrecarregar o aluno.", "Confirme se os dois parceiros entendem seus papéis antes de iniciar."]} />
          <MemorandoPedagogico label="Cuidados e adaptações" placeholder="Riscos, segurança e adaptações para alunos menores ou iniciantes." value={novoConteudo.cuidados} onChange={(value) => setNovoConteudo((atual) => ({ ...atual, cuidados: value }))} sugestoes={["Reduza amplitude e velocidade para iniciantes ou crianças menores.", "Interrompa se houver dor, desconforto ou perda de controle.", "Use parceiro compatível e supervisão próxima nas primeiras repetições."]} />
          <Input label="Idade mínima recomendada" type="number" min="0" value={novoConteudo.faixaEtariaMinima} onChange={(event) => setNovoConteudo((atual) => ({ ...atual, faixaEtariaMinima: event.target.value }))} />
          <Input label="Idade máxima recomendada" type="number" min="0" value={novoConteudo.faixaEtariaMaxima} onChange={(event) => setNovoConteudo((atual) => ({ ...atual, faixaEtariaMaxima: event.target.value }))} />
          <Button type="submit" disabled={salvando || !novoConteudo.modalidadeId || !novoConteudo.nome.trim()}>{salvando ? "Salvando..." : "Cadastrar conteúdo"}</Button>
        </form>
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
                  duracaoPrevistaMinutos: String(Math.max(1, Math.round(modal.editando.duracaoPrevistaSegundos / 60))),
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
      <ConfirmDialog open={conteudoParaExcluir !== null} title="Remover conteúdo" message={`Remover o conteúdo "${conteudoParaExcluir?.nome ?? ""}"?`} confirmLabel="Remover" onConfirm={() => { if (conteudoParaExcluir) void handleExcluirConteudo(conteudoParaExcluir); setConteudoParaExcluir(null); }} onCancel={() => setConteudoParaExcluir(null)} />
    </Layout>
  );
}
