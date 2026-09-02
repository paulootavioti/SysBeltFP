import { useState } from "react";
import { LuDownload, LuFileUp, LuUndo2 } from "react-icons/lu";
import { api } from "../../../services/api";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Modal } from "../../../components/ui/Modal";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

type LinhaPrevia = {
  linha: number;
  dados: { nome?: string; dataNascimento?: string; turma?: string };
  valido: boolean;
  duplicado: boolean;
  erro: string | null;
};
type Previa = {
  hashArquivo: string;
  totalLinhas: number;
  totalValidas: number;
  totalErros: number;
  totalDuplicados: number;
  linhas: LinhaPrevia[];
};
type Resultado = {
  loteId: number;
  desfazivelAte: string;
  totalLinhas: number;
  totalImportados: number;
  totalAtualizados: number;
  totalIgnorados: number;
  totalErros: number;
  erros: Array<{ linha: number; nome: string; erro: string }>;
};

export function ImportarAlunosModal({ open, onClose, onImportado }: { open: boolean; onClose: () => void; onImportado: () => Promise<void> }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [estrategia, setEstrategia] = useState<"IGNORAR" | "ATUALIZAR">("IGNORAR");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  function baixarModelo() {
    const conteudo = "nome;data_nascimento;apelido;email;telefone;whatsapp;cpf;faixa;turma;observacoes\nMaria Silva;15/04/2012;Mari;maria@exemplo.com;(11) 99999-9999;;;Branca;Infantil;\n";
    const url = URL.createObjectURL(new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "modelo-importacao-alunos.csv"; link.click(); URL.revokeObjectURL(url);
  }

  function dadosArquivo() {
    const dados = new FormData();
    if (arquivo) dados.append("arquivo", arquivo);
    return dados;
  }

  async function previsualizar() {
    if (!arquivo) return;
    try {
      setEnviando(true); setErro(""); setResultado(null);
      const response = await api.post<Previa>("/alunos/importacoes/previsualizar", dadosArquivo());
      setPrevia(response.data);
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível analisar o arquivo.")); }
    finally { setEnviando(false); }
  }

  async function confirmar() {
    if (!arquivo || !previa) return;
    try {
      setEnviando(true); setErro("");
      const dados = dadosArquivo(); dados.append("estrategiaDuplicados", estrategia);
      const response = await api.post<Resultado>("/alunos/importacoes/confirmar", dados);
      setResultado(response.data); setPrevia(null);
      if (response.data.totalImportados || response.data.totalAtualizados) await onImportado();
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível confirmar a importação.")); }
    finally { setEnviando(false); }
  }

  async function desfazer() {
    if (!resultado || !window.confirm("Remover os alunos criados por esta importação?")) return;
    try {
      setEnviando(true); setErro("");
      await api.post(`/alunos/importacoes/${resultado.loteId}/desfazer`);
      setResultado(null); setArquivo(null); await onImportado();
    } catch (e) { setErro(getApiErrorMessage(e, "Não foi possível desfazer a importação.")); }
    finally { setEnviando(false); }
  }

  return <Modal open={open} title="Importar alunos por CSV" onClose={onClose} size="lg">
    <div className="alunos-importacao">
      {!previa && !resultado && <><div className="alunos-importacao-topo"><p>Envie o arquivo para conferir linhas, erros e duplicados antes de gravar.</p><Button type="button" variant="secondary" onClick={baixarModelo}><LuDownload /> Baixar modelo</Button></div><label className="alunos-arquivo"><LuFileUp size={28} /><span>{arquivo?.name ?? "Selecionar arquivo CSV"}</span><input type="file" accept=".csv,text/csv" onChange={(e) => { setArquivo(e.target.files?.[0] ?? null); setPrevia(null); }} /></label></>}
      <ErrorMessage message={erro} />
      {previa && <section className="importacao-previa"><header><h3>Prévia da importação</h3><p>{previa.totalLinhas} linhas · {previa.totalErros} com erro · {previa.totalDuplicados} duplicadas</p></header><div className="table-wrapper"><table><thead><tr><th>Linha</th><th>Aluno</th><th>Nascimento</th><th>Turma</th><th>Situação</th></tr></thead><tbody>{previa.linhas.map((item) => <tr key={item.linha}><td>{item.linha}</td><td>{item.dados.nome || "—"}</td><td>{item.dados.dataNascimento || "—"}</td><td>{item.dados.turma || "—"}</td><td>{item.erro || (item.duplicado ? "Duplicado" : "Pronto")}</td></tr>)}</tbody></table></div>{previa.totalLinhas > 20 && <small>Exibindo as primeiras 20 linhas.</small>}{previa.totalDuplicados > 0 && <fieldset><legend>Alunos duplicados</legend><label><input type="radio" checked={estrategia === "IGNORAR"} onChange={() => setEstrategia("IGNORAR")} /> Ignorar existentes</label><label><input type="radio" checked={estrategia === "ATUALIZAR"} onChange={() => setEstrategia("ATUALIZAR")} /> Atualizar com os dados preenchidos</label></fieldset>}</section>}
      {resultado && <section className="alunos-importacao-resultado" role="status"><strong>{resultado.totalImportados} alunos criados</strong><p>{resultado.totalAtualizados} atualizados · {resultado.totalIgnorados} ignorados · {resultado.totalErros} erros</p><Button type="button" variant="secondary" onClick={() => void desfazer()} disabled={enviando}><LuUndo2 /> Desfazer esta importação</Button><small>Disponível até {new Date(resultado.desfazivelAte).toLocaleString("pt-BR")}.</small></section>}
      <div className="alunos-importacao-acoes"><Button type="button" variant="secondary" onClick={onClose}>Fechar</Button>{!previa && !resultado && <Button type="button" onClick={() => void previsualizar()} disabled={!arquivo || enviando}>{enviando ? "Analisando..." : "Ver prévia"}</Button>}{previa && <><Button type="button" variant="secondary" onClick={() => setPrevia(null)}>Voltar</Button><Button type="button" onClick={() => void confirmar()} disabled={!previa.totalValidas || enviando}>{enviando ? "Importando..." : `Importar ${previa.totalValidas - (estrategia === "IGNORAR" ? previa.totalDuplicados : 0)} alunos`}</Button></>}</div>
    </div>
  </Modal>;
}
