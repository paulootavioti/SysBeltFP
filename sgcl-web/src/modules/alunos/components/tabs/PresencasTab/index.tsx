import type { Presenca } from "../../../types/presenca";

interface PresencasTabProps {
  aluno: { presencas?: Presenca[] };
}

export function PresencasTab({
  aluno,
}: PresencasTabProps) {
  if (!aluno.presencas?.length) {
    return <p>Nenhuma presença registrada.</p>;
  }

  return (
    <div>
      <h3>Presenças ({aluno.presencas.length})</h3>

      {aluno.presencas.map((presenca) => (
        <p key={presenca.id}>
          {new Date(
            presenca.data
          ).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          })}
        </p>
      ))}
    </div>
  );
}