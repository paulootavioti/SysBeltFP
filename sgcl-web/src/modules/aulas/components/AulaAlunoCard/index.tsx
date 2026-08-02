import { useState } from "react";

import { Checkbox } from "../../../../components/ui/Checkbox";
import { Button } from "../../../../components/ui/Button";
import { Textarea } from "../../../../components/ui/Textarea";
import { BehaviorSelector } from "../BehaviorSelector";
import { calcularIdade } from "../../../../shared/formatters/data";
import { linkWhatsapp, formatarTelefoneWhatsapp } from "../../../../shared/utils/linkWhatsapp";

import type { AulaAlunoCardProps } from "./types";

import "./styles.css";

export function AulaAlunoCard({
  registro,
  aulaFinalizada,
  dataAula,
  onChange,
}: AulaAlunoCardProps) {
  const [observacaoLocal, setObservacaoLocal] = useState(registro.observacao ?? "");

  function salvarObservacaoSeAlterada() {
    if (observacaoLocal !== (registro.observacao ?? "")) {
      onChange(registro, { observacao: observacaoLocal || null });
    }
  }

  const idade = calcularIdade(registro.aluno.dataNascimento);
  const avaliaComportamento = idade !== null && idade <= 14;
  const menorDeIdade = idade !== null && idade < 18;

  const responsavel = registro.aluno.responsaveis?.find(
    (item) => item.recebeComunicados && (item.whatsapp || item.telefone)
  );

  const telefoneResponsavel = formatarTelefoneWhatsapp(
    responsavel?.whatsapp || responsavel?.telefone
  );

  const linkPresenca =
    responsavel && telefoneResponsavel
      ? linkWhatsapp(
          telefoneResponsavel,
          `Olá ${responsavel.nome}, informamos que ${
            registro.aluno.apelido || registro.aluno.nome
          } esteve presente no treino de ${new Date(dataAula).toLocaleDateString(
            "pt-BR",
            { timeZone: "UTC" }
          )}.`
        )
      : null;

  return (
    <article className="aula-aluno-card">
      <header className="aula-aluno-card-header">
        <div>
          <h3>{registro.aluno.apelido || registro.aluno.nome}</h3>

          <p>
            Faixa {registro.aluno.faixa} • Grau{" "}
            {registro.aluno.grau}
          </p>
        </div>

        <Checkbox
          label="Presente"
          checked={registro.presente}
          disabled={aulaFinalizada}
          onChange={(event) =>
            onChange(registro, {
              presente: event.target.checked,
            })
          }
        />
      </header>

      {registro.presente && menorDeIdade && linkPresenca && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.open(linkPresenca, "_blank")}
        >
          Avisar responsável no WhatsApp
        </Button>
      )}

      {avaliaComportamento && (
        <BehaviorSelector
          disabled={aulaFinalizada}
          values={{
            respeito: registro.respeito,
            valentia: registro.valentia,
            esforco: registro.esforco,
            atencao: registro.atencao,
            disciplina: registro.disciplina,
          }}
          onChange={(field, value) =>
            onChange(registro, {
              [field]: value,
            })
          }
        />
      )}

      <Textarea
        label="Observação"
        placeholder="Alguma observação sobre esse aluno nesta aula? (opcional)"
        rows={2}
        disabled={aulaFinalizada}
        value={observacaoLocal}
        onChange={(event) => setObservacaoLocal(event.target.value)}
        onBlur={salvarObservacaoSeAlterada}
      />
    </article>
  );
}