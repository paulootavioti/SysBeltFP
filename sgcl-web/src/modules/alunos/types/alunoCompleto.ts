import type { Aluno, AlunoBasico } from "./aluno";
import type { Responsavel } from "../../responsaveis/types/responsavel";
import type { Presenca } from "./presenca";
import type { Graduacao } from "./graduacao";
import type { Mensalidade } from "../../mensalidades/types/mensalidade";


export interface AlunoCompleto extends Aluno {
  responsaveis?: Responsavel[];
  presencas?: Presenca[];
  graduacoes?: Graduacao[];
  mensalidades?: Mensalidade[];
  frequenciaMes?: number;
  frequenciaAno?: number;
}

// versão redigida devolvida pelo backend pra PROFESSOR.
export interface AlunoCompletoBasico extends AlunoBasico {
  presencas?: Presenca[];
  graduacoes?: Graduacao[];
  frequenciaMes?: number;
  frequenciaAno?: number;
}