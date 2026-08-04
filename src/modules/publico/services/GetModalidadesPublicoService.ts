// Lista fixa (não depende de unidade nem de banco) — mesmas 4 modalidades
// hoje fixas no HTML da landing (landing-academia/index.html), movidas pra
// cá só pra a landing buscar tudo via API, igual aos outros grids.
const MODALIDADES = [
  {
    id: "jiu-jitsu-kids",
    nome: "Jiu-Jitsu Kids",
    publico: "4 a 13 anos",
    descricao: "Disciplina, respeito e defesa pessoal num ambiente lúdico e seguro para crianças.",
  },
  {
    id: "jiu-jitsu-adulto",
    nome: "Jiu-Jitsu Adulto",
    publico: "14+ anos",
    descricao: "Técnica, condicionamento e evolução constante — do iniciante ao competidor.",
  },
  {
    id: "grappling",
    nome: "Grappling",
    publico: "Sem kimono",
    descricao: "Luta agarrada sem kimono, ritmo intenso e foco em transições e finalizações.",
  },
  {
    id: "autodefesa",
    nome: "Autodefesa",
    publico: "Todas as idades",
    descricao: "Técnicas práticas de defesa pessoal baseadas nos fundamentos do Jiu-Jitsu.",
  },
] as const;

export class GetModalidadesPublicoService {
  async execute() {
    return MODALIDADES;
  }
}
