import type { Aluno } from "./aluno";
import type { Responsavel } from "../../responsaveis/types/responsavel";
import type { Presenca } from "./presenca";
import type { Graduacao } from "./graduacao";
import type { Mensalidade } from "../../mensalidades/types/mensalidade";


export interface AlunoCompleto extends Aluno {
  responsaveis?: Responsavel[];
  presencas?: Presenca[];
  graduacoes?: Graduacao[];
  mensalidades?: Mensalidade[];
}