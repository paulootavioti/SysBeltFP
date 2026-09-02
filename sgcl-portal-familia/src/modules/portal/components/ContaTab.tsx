import { useState } from "react";
import type { FormEvent } from "react";
import { LuCheck, LuLockKeyhole } from "react-icons/lu";

import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Input } from "../../../components/ui/Input";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import { PortalService } from "../services/PortalService";

export function ContaTab() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setErro("");
    setSucesso(false);
    if (novaSenha.length < 8) return setErro("A nova senha deve ter pelo menos 8 caracteres.");
    if (novaSenha !== confirmacao) return setErro("A confirmação não corresponde à nova senha.");
    try {
      setSalvando(true);
      await PortalService.alterarSenha(senhaAtual, novaSenha);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setSucesso(true);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível alterar a senha."));
    } finally {
      setSalvando(false);
    }
  }

  return <section className="conta-secao">
    <header><LuLockKeyhole aria-hidden /><div><h2>Senha de acesso</h2><p>Atualize a senha usada para entrar no Portal da Família.</p></div></header>
    <form onSubmit={enviar}>
      <Input label="Senha atual" type="password" autoComplete="current-password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
      <Input label="Nova senha" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} minLength={8} required />
      <Input label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} minLength={8} required />
      <ErrorMessage message={erro} />
      {sucesso && <p className="conta-sucesso"><LuCheck aria-hidden /> Senha alterada com sucesso.</p>}
      <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Alterar senha"}</Button>
    </form>
  </section>;
}
