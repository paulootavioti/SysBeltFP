import { z } from "zod";

export const curriculoSchema = z.object({
  nome: z.string().min(3, "Informe o nome do currículo."),
  descricao: z.string().optional(),
  modalidadeId: z.string().optional(),
  publico: z.string().optional(),
});

export type CurriculoFormData = z.infer<typeof curriculoSchema>;

export const moduloSchema = z.object({
  nome: z.string().min(3, "Informe o nome do módulo."),
  descricao: z.string().optional(),
  faixa: z.string().optional(),
});

export type ModuloFormData = z.infer<typeof moduloSchema>;

export const aulaCurriculoSchema = z.object({
  titulo: z.string().min(3, "Informe o título da aula."),
  objetivo: z.string().optional(),
  descricao: z.string().optional(),
  duracaoMinutos: z.string().optional(),
  jogosSugeridos: z.string().optional(),
  blocos: z.array(z.object({
    tipo: z.enum(["AQUECIMENTO", "JOGO", "SPARRING", "PAUSA", "ALONGAMENTO"]),
    nome: z.string().min(1, "Informe o nome do bloco."),
    duracaoMinutos: z.string().min(1, "Informe a duração."),
    rounds: z.string().optional(),
    duracaoRoundMinutos: z.string().optional(),
    descansoSegundos: z.string().optional(),
    anuncio: z.string().optional(),
  })).optional(),
});

export type AulaCurriculoFormData = z.infer<typeof aulaCurriculoSchema>;

export const tecnicaCurriculoSchema = z.object({
  nome: z.string().min(2, "Informe o nome da técnica."),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  obrigatoria: z.boolean().optional(),
  duracaoPrevistaMinutos: z.string().min(1, "Informe a duração prevista."),
});

export type TecnicaCurriculoFormData = z.infer<typeof tecnicaCurriculoSchema>;
