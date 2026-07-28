import type { ResponsavelBasico } from "../../../types/aluno";

interface ResponsaveisNomeTabProps {
  responsaveis?: ResponsavelBasico[];
}

// versão restrita da aba de Responsáveis pro perfil PROFESSOR — só o nome,
// sem contato, parentesco ou dados financeiros.
export function ResponsaveisNomeTab({ responsaveis = [] }: ResponsaveisNomeTabProps) {
  if (responsaveis.length === 0) {
    return <p>Nenhum responsável cadastrado.</p>;
  }

  return (
    <div>
      <h3>Responsáveis</h3>
      <ul>
        {responsaveis.map((responsavel) => (
          <li key={responsavel.id}>{responsavel.nome}</li>
        ))}
      </ul>
    </div>
  );
}
