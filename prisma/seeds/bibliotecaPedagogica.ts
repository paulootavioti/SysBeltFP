import "dotenv/config";
import { PrismaClient, TipoConteudoTecnico, NivelDificuldadePedagogica, TipoBlocoAulaCurriculo } from "@prisma/client";

const prisma = new PrismaClient();

const modalidades = [
  ["jiu-jitsu-brasileiro", "Jiu-Jitsu Brasileiro"], ["judo", "Judô"], ["muay-thai", "Muay Thai"], ["boxe", "Boxe"], ["kickboxing", "Kickboxing"], ["wrestling", "Wrestling"], ["luta-livre", "Luta Livre"], ["karate", "Karatê"], ["taekwondo", "Taekwondo"], ["capoeira", "Capoeira"], ["mma", "MMA"], ["aikido", "Aikido"], ["hapkido", "Hapkido"], ["kung-fu", "Kung Fu"], ["sambo", "Sambo"], ["krav-maga", "Krav Maga"],
] as const;

const bjj: Array<[string, TipoConteudoTecnico, string, NivelDificuldadePedagogica]> = [
  ["Base e postura", "POSICAO", "Postura equilibrada, controle de distância e proteção articular.", "INICIANTE"], ["Guarda fechada", "POSICAO", "Controle com pernas fechadas, postura e conexão com o parceiro.", "INICIANTE"], ["Guarda aberta", "POSICAO", "Organização de distância com pés e pegadas.", "BASICO"], ["Meia guarda", "POSICAO", "Posição de conexão lateral com controle de uma perna.", "BASICO"], ["Guarda borboleta", "POSICAO", "Controle sentado com ganchos internos.", "BASICO"], ["Guarda De La Riva", "POSICAO", "Guarda aberta com gancho externo e controle de distância.", "INTERMEDIARIO"], ["Guarda X", "POSICAO", "Controle das pernas para criar desequilíbrio com segurança.", "INTERMEDIARIO"], ["Montada", "CONTROLE", "Controle superior com base, postura e distribuição de peso.", "INICIANTE"], ["Controle lateral", "CONTROLE", "Controle superior lateral priorizando pressão progressiva e conforto do parceiro.", "INICIANTE"], ["Costas", "CONTROLE", "Controle posterior com segurança e proteção do pescoço.", "BASICO"], ["Passagem de guarda em pé", "PASSAGEM", "Entrada controlada para superar a linha das pernas.", "BASICO"], ["Passagem toreando", "PASSAGEM", "Passagem com controle de pernas e deslocamento lateral.", "BASICO"], ["Passagem de joelho", "PASSAGEM", "Progressão de pressão e controle de quadril.", "INTERMEDIARIO"], ["Raspagem tesoura", "RASPAGEM", "Desequilíbrio com alavanca e direção controlada.", "BASICO"], ["Raspagem de gancho", "RASPAGEM", "Uso de ganchos para quebrar equilíbrio e chegar ao topo.", "BASICO"], ["Raspagem da Guarda X", "RASPAGEM", "Desequilíbrio progressivo a partir do controle das pernas.", "INTERMEDIARIO"], ["Escape de quadril", "ESCAPE", "Movimento fundamental para criar espaço e recuperar guarda.", "INICIANTE"], ["Ponte e rolamento", "ESCAPE", "Movimento de saída com controle e proteção cervical.", "INICIANTE"], ["Escape de cotovelo", "ESCAPE", "Criação de estrutura para sair da montada com segurança.", "BASICO"], ["Defesa de queda", "DEFESA", "Postura, distância e reação sem impacto desnecessário.", "BASICO"], ["Queda de perna única", "QUEDA", "Entrada técnica controlada, com parceiro cooperativo no aprendizado.", "INTERMEDIARIO"], ["Queda de perna dupla", "QUEDA", "Entrada com postura, direção e queda segura.", "INTERMEDIARIO"], ["Estrangulamento cruzado", "FINALIZACAO", "Controle de pegadas e aplicação apenas sob supervisão qualificada.", "BASICO"], ["Chave de braço da montada", "FINALIZACAO", "Isolamento de braço e controle gradual, respeitando o tap.", "BASICO"], ["Kimura da guarda", "FINALIZACAO", "Controle de ombro com progressão cuidadosa e tap imediato.", "INTERMEDIARIO"], ["Drill de fuga de quadril", "DRILL", "Repetições curtas de mobilidade e recuperação de guarda.", "INICIANTE"], ["Drill de passagem", "DRILL", "Alternância de papéis para consolidar base e pressão gradual.", "BASICO"], ["Drill de entrada na Guarda X", "DRILL", "Sequência cooperativa de entrada, controle e saída segura.", "INTERMEDIARIO"], ["Mobilidade de quadril", "MOBILIDADE", "Preparação de quadril e coluna com amplitude confortável.", "INICIANTE"], ["Aquecimento lúdico", "AQUECIMENTO", "Ativação com jogos de deslocamento e consciência espacial.", "INICIANTE"], ["Pummeling de pegadas", "EXERCICIO", "Exercício de disputa leve de pegadas com regras claras.", "BASICO"], ["Situação específica de guarda", "EXERCICIO", "Rodadas curtas com objetivo e resistência progressiva.", "INTERMEDIARIO"], ["Avaliação de base", "AVALIACAO", "Observação de postura, equilíbrio e decisão em situação guiada.", "INICIANTE"], ["Avaliação de sequência técnica", "AVALIACAO", "Demonstração adaptada ao nível, com critérios claros e feedback.", "BASICO"],
];

async function criarConteudo(modalidadeId: number, nome: string, tipo: TipoConteudoTecnico, descricao: string, nivel: NivelDificuldadePedagogica) {
  const existe = await prisma.conteudoTecnico.findFirst({ where: { unidadeId: null, modalidadeId, nome } });
  if (existe) return existe;
  return prisma.conteudoTecnico.create({ data: { modalidadeId, nome, tipo, descricao, objetivo: `Desenvolver ${nome.toLocaleLowerCase("pt-BR")} com segurança.`, pontosAtencao: "Respeitar nível, idade, limite individual e comunicação imediata de desconforto.", cuidados: "Praticar sob supervisão de professor qualificado e interromper diante de dor ou risco.", nivelDificuldade: nivel, duracaoSugeridaSegundos: tipo === "AQUECIMENTO" ? 480 : tipo === "AVALIACAO" ? 300 : 600 } });
}

async function main() {
  const criadas = await Promise.all(modalidades.map(([slug, nome]) => prisma.bibliotecaModalidade.upsert({ where: { slug }, update: { nome, ativa: true }, create: { slug, nome, ativa: true } })));
  const bjjModalidade = criadas.find((modalidade) => modalidade.slug === "jiu-jitsu-brasileiro");
  if (!bjjModalidade) throw new Error("Modalidade Jiu-Jitsu Brasileiro não encontrada.");
  for (const [nome, tipo, descricao, nivel] of bjj) await criarConteudo(bjjModalidade.id, nome, tipo, descricao, nivel);
  for (const modalidade of criadas.filter((item) => item.id !== bjjModalidade.id)) {
    await criarConteudo(modalidade.id, "Base e deslocamento", "MOVIMENTO", "Fundamentos de postura, distância e deslocamento adequados à modalidade.", "INICIANTE");
    await criarConteudo(modalidade.id, "Aquecimento específico", "AQUECIMENTO", "Ativação progressiva com mobilidade e atenção à segurança.", "INICIANTE");
  }
  const templates: Array<[string, string, Array<[TipoBlocoAulaCurriculo, string, number]>]> = [
    ["Aula técnica", "Fundamentos, prática guiada e avaliação breve.", [["AQUECIMENTO", "Aquecimento", 600], ["TECNICA", "Técnica principal", 900], ["TECNICA", "Drill", 600], ["SPARRING", "Aplicação situacional", 600], ["PAUSA", "Avaliação e feedback", 300]]],
    ["Aula infantil", "Ritmo lúdico com instruções curtas e segurança.", [["AQUECIMENTO", "Aquecimento lúdico", 600], ["TECNICA", "Técnica guiada", 600], ["JOGO", "Jogo pedagógico", 600], ["TECNICA", "Exercício em dupla", 480], ["PAUSA", "Revisão", 300]]],
    ["Preparação para graduação", "Revisão estruturada de conteúdos obrigatórios.", [["AQUECIMENTO", "Mobilidade e revisão", 480], ["TECNICA", "Técnicas obrigatórias", 1200], ["TECNICA", "Simulação", 900], ["PAUSA", "Avaliação", 420]]],
  ];
  for (const [nome, descricao, etapas] of templates) {
    const existe = await prisma.templatePlanejamento.findFirst({ where: { unidadeId: null, nome } });
    if (!existe) await prisma.templatePlanejamento.create({ data: { nome, descricao, etapas: { create: etapas.map(([tipo, titulo, duracaoSegundos], ordem) => ({ tipo, titulo, duracaoSegundos, ordem })) } } });
  }
  console.log(`Biblioteca pedagógica pronta: ${criadas.length} modalidades e ${bjj.length + (criadas.length - 1) * 2} conteúdos globais.`);
}

main().catch((erro) => { console.error(erro); process.exit(1); }).finally(() => prisma.$disconnect());
