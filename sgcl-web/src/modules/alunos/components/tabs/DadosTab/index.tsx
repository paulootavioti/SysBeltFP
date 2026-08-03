import type { AlunoCompleto } from "../../../types/alunoCompleto";

interface DadosTabProps {
  aluno: AlunoCompleto;
}

export function DadosTab({ aluno }: DadosTabProps) {
  return (
    <div>
      <h3>Dados do Aluno</h3>

      <p><strong>Telefone:</strong> {aluno.telefone || "-"}</p>
      <p><strong>WhatsApp:</strong> {aluno.whatsapp || "-"}</p>
      <p><strong>Email:</strong> {aluno.email || "-"}</p>

      <p>
        <strong>Endereço:</strong>{" "}
        {aluno.logradouro || "-"}
        {aluno.numero ? `, ${aluno.numero}` : ""}
      </p>

      <p><strong>Bairro:</strong> {aluno.bairro || "-"}</p>

      <p>
        <strong>Cidade/UF:</strong>{" "}
        {aluno.cidade || "-"} / {aluno.uf || "-"}
      </p>

      <p><strong>Escola:</strong> {aluno.escola || "-"}</p>
      <p><strong>Série:</strong> {aluno.serieEscolar || "-"}</p>
      <p><strong>Turno:</strong> {aluno.turnoEscolar || "-"}</p>

      {aluno.autorizaUsoImagem !== undefined && (
        <p>
          <strong>Autoriza uso de imagem:</strong>{" "}
          {aluno.autorizaUsoImagem ? "Sim" : "Não"}
        </p>
      )}
    </div>
  );
}