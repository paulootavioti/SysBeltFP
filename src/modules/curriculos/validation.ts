import { z } from "zod";

export const curriculoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do currículo."),
  descricao: z.string().nullish(),
  modalidadeId: z.coerce.number().int().positive().nullish(),
  publico: z.string().nullish(),
});

export const moduloCurriculoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do módulo."),
  descricao: z.string().nullish(),
  faixa: z.string().nullish(),
  idadeMinima: z.coerce.number().int().nullish(),
  idadeMaxima: z.coerce.number().int().nullish(),
  ordem: z.coerce.number().int().nullish(),
  curriculoId: z.coerce.number().int().positive().optional(),
});

export const aulaCurriculoSchema = z.object({
  titulo: z.string().min(1, "Informe o título da aula."),
  objetivo: z.string().nullish(),
  descricao: z.string().nullish(),
  duracaoMinutos: z.coerce.number().int().nullish(),
  jogosSugeridos: z.string().nullish(),
  ordem: z.coerce.number().int().nullish(),
  moduloId: z.coerce.number().int().positive().optional(),
  blocos: z.array(z.object({
    tipo: z.enum(["AQUECIMENTO", "JOGO", "TECNICA", "SPARRING", "PAUSA", "ALONGAMENTO"]),
    nome: z.string().trim().min(1).max(120),
    ordem: z.coerce.number().int().min(0),
    duracaoPrevistaSegundos: z.coerce.number().int().positive().max(14400),
    rounds: z.coerce.number().int().positive().max(30).nullish(),
    duracaoRoundSegundos: z.coerce.number().int().positive().max(3600).nullish(),
    descansoSegundos: z.coerce.number().int().min(0).max(1800).nullish(),
    anuncio: z.string().trim().max(300).nullish(),
    descricao: z.string().trim().max(2000).nullish(),
    atencoesFaixaEtaria: z.string().trim().max(1200).nullish(),
    conteudoTecnicoId: z.coerce.number().int().positive().nullish(),
  })).max(50).optional(),
});

export const aulaAssistidaSchema = z.object({
  moduloId: z.coerce.number().int().positive(),
  titulo: z.string().trim().min(2).max(160),
  objetivo: z.string().trim().max(1000).nullish(),
  descricao: z.string().trim().max(3000).nullish(),
  templateId: z.coerce.number().int().positive().nullish(),
  conteudoIds: z.array(z.coerce.number().int().positive()).min(1).max(12),
  substituirEtapasTecnicas: z.boolean().optional(),
});

export const tecnicaCurriculoSchema = z.object({
  nome: z.string().min(1, "Informe o nome da técnica."),
  categoria: z.string().nullish(),
  descricao: z.string().nullish(),
  obrigatoria: z.boolean().nullish(),
  ordem: z.coerce.number().int().nullish(),
  aulaCurriculoId: z.coerce.number().int().positive().optional(),
  duracaoPrevistaSegundos: z.coerce.number().int().positive().max(14400).nullish(),
});

export const itemCatalogoPedagogicoSchema = z.object({
  tipo: z.enum(["POSICAO", "EXERCICIO", "MOMENTO"]),
  nome: z.string().trim().min(2).max(120),
  tipoBloco: z.enum(["AQUECIMENTO", "JOGO", "TECNICA", "SPARRING", "PAUSA", "ALONGAMENTO"]).nullish(),
  descricao: z.string().trim().max(2000).nullish(),
  atencoesFaixaEtaria: z.string().trim().max(1200).nullish(),
  duracaoPrevistaSegundos: z.coerce.number().int().positive().max(14400),
});

const blocoImportacaoSchema = z.object({
  tipo: z.enum(["AQUECIMENTO", "JOGO", "TECNICA", "SPARRING", "PAUSA", "ALONGAMENTO"]),
  nome: z.string().trim().min(1).max(120),
  ordem: z.coerce.number().int().min(0),
  duracaoPrevistaSegundos: z.coerce.number().int().positive().max(14400),
  rounds: z.coerce.number().int().positive().max(30).nullish(),
  duracaoRoundSegundos: z.coerce.number().int().positive().max(3600).nullish(),
  descansoSegundos: z.coerce.number().int().min(0).max(1800).nullish(),
  anuncio: z.string().trim().max(300).nullish(),
  descricao: z.string().trim().max(2000).nullish(),
  atencoesFaixaEtaria: z.string().trim().max(1200).nullish(),
});

const tecnicaImportacaoSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  categoria: z.string().trim().max(120).nullish(),
  descricao: z.string().trim().max(3000).nullish(),
  obrigatoria: z.boolean().optional(),
  ordem: z.coerce.number().int().min(0),
  duracaoPrevistaSegundos: z.coerce.number().int().positive().max(14400),
});

export const curriculoArquivoSchema = z.object({
    nome: z.string().trim().min(1).max(160),
    descricao: z.string().trim().max(5000).nullish(),
    publico: z.string().trim().max(160).nullish(),
    modalidadeNome: z.string().trim().min(1).max(120).nullish(),
    modulos: z.array(z.object({
      nome: z.string().trim().min(1).max(160),
      descricao: z.string().trim().max(5000).nullish(),
      faixa: z.string().trim().max(160).nullish(),
      idadeMinima: z.coerce.number().int().min(0).max(120).nullish(),
      idadeMaxima: z.coerce.number().int().min(0).max(120).nullish(),
      ordem: z.coerce.number().int().min(0),
      aulas: z.array(z.object({
        titulo: z.string().trim().min(1).max(160),
        objetivo: z.string().trim().max(3000).nullish(),
        descricao: z.string().trim().max(5000).nullish(),
        duracaoMinutos: z.coerce.number().int().positive().max(1440).nullish(),
        jogosSugeridos: z.string().trim().max(3000).nullish(),
        ordem: z.coerce.number().int().min(0),
        blocos: z.array(blocoImportacaoSchema).max(50),
        tecnicas: z.array(tecnicaImportacaoSchema).max(100),
      })).max(200),
    })).max(100),
});

export const curriculoImportacaoSchema = z.object({
  schema: z.literal("sysbelt-planejamento"),
  versao: z.literal(1),
  curriculo: curriculoArquivoSchema,
});

export const matrizPlanejamentoImportacaoSchema = z.object({
  schema: z.literal("sysbelt-matriz-planejamento"),
  versao: z.literal(1),
  matriz: z.object({
    nome: z.string().trim().min(1).max(160),
    curriculos: z.array(curriculoArquivoSchema).min(1).max(100),
  }),
});
