import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Loading } from "../../../components/ui/Loading";
import { formatarData } from "../../../utils/formatarData";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import { PortalService } from "../services/PortalService";
import type { ConsentimentoFamilia } from "../types";

const ROTULOS: Record<ConsentimentoFamilia["tipo"], string> = {
  TRATAMENTO_DADOS: "Tratamento de dados",
  USO_IMAGEM: "Uso de imagem",
  BIOMETRIA: "Biometria",
  DADOS_SAUDE: "Dados de saúde",
  COMUNICACOES: "Comunicações",
};

export function PrivacidadeTab({ alunoId }: { alunoId: number }) {
  const [itens, setItens] = useState<ConsentimentoFamilia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  async function carregar() {
    try { setErro(""); setItens(await PortalService.consentimentos(alunoId)); }
    catch (error) { setErro(getApiErrorMessage(error, "Não foi possível carregar os consentimentos.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void carregar(); }, [alunoId]);
  async function revogar(item: ConsentimentoFamilia) {
    if (!window.confirm(`Revogar o consentimento de ${ROTULOS[item.tipo]}?`)) return;
    try { await PortalService.revogarConsentimento(item.id); await carregar(); }
    catch (error) { setErro(getApiErrorMessage(error, "Não foi possível revogar o consentimento.")); }
  }
  if (loading) return <Loading />;
  return <section className="privacidade-tab"><h2>Privacidade e consentimentos</h2><p>Veja quem autorizou o uso dos dados e revogue uma autorização ativa.</p><ErrorMessage message={erro} />{!itens.length ? <EmptyState title="Nenhum consentimento registrado" description="Procure a academia para revisar o cadastro." /> : <div className="privacidade-lista">{itens.map((item) => <article key={item.id}><div><h3>{ROTULOS[item.tipo]}</h3><p>{item.revogadoEm ? `Revogado em ${formatarData(item.revogadoEm)}` : `Autorizado em ${formatarData(item.createdAt)}`}</p><span>{item.responsavel?.nome ? `Responsável: ${item.responsavel.nome}` : "Titular do dado"}</span><details><summary>Texto aceito · versão {item.versaoPolitica}</summary><p>{item.textoAceito || "Texto integral não registrado nesta versão."}</p></details></div>{!item.revogadoEm && item.concedido && <Button type="button" variant="danger" size="sm" onClick={() => void revogar(item)}>Revogar</Button>}</article>)}</div>}</section>;
}
