import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { Select } from "../../../components/ui/Select";

import { aulaCurriculoSchema, type AulaCurriculoFormData } from "../schema/curriculo.schema";
import type { ConteudoBiblioteca, ItemCatalogoPedagogico, TemplatePlanejamento, TipoBlocoCurriculo } from "../types/curriculo";
import { MemorandoPedagogico } from "./MemorandoPedagogico";

interface AulaCurriculoFormProps {
  loading?: boolean;
  initialValues?: Partial<AulaCurriculoFormData>;
  onSubmit: (data: AulaCurriculoFormData) => void;
  itensCatalogo?: ItemCatalogoPedagogico[];
  conteudosBiblioteca?: ConteudoBiblioteca[];
  templates?: TemplatePlanejamento[];
}

const AULA_DEFAULTS: AulaCurriculoFormData = {
  titulo: "",
  objetivo: "",
  descricao: "",
  duracaoMinutos: "",
  jogosSugeridos: "",
  blocos: [],
};

const TIPOS_BLOCO = [
  { value: "AQUECIMENTO", label: "Aquecimento" },
  { value: "JOGO", label: "Jogo" },
  { value: "TECNICA", label: "Posição ou exercício" },
  { value: "SPARRING", label: "Sparring" },
  { value: "PAUSA", label: "Pausa" },
  { value: "ALONGAMENTO", label: "Alongamento" },
] as const;

const MOMENTOS_SUGERIDOS = [
  { tipo: "AQUECIMENTO", nome: "Aquecimento lúdico", duracaoMinutos: "8", descricao: "Ativação corporal progressiva com deslocamentos, mobilidade e movimentos da modalidade.", atencoesFaixaEtaria: "Crianças: priorize brincadeira, espaço livre e instruções curtas." },
  { tipo: "JOGO", nome: "Jogo pedagógico", duracaoMinutos: "10", descricao: "Dinâmica com objetivo técnico claro, demonstração breve e rodízio para todos participarem.", atencoesFaixaEtaria: "Adequar regras, pares e intensidade à idade e maturidade da turma." },
  { tipo: "PAUSA", nome: "Água e reorganização", duracaoMinutos: "2", descricao: "Pausa para hidratação, retomada da atenção e explicação da próxima etapa.", atencoesFaixaEtaria: "Crianças menores podem precisar de mais tempo para se reorganizar." },
  { tipo: "ALONGAMENTO", nome: "Volta à calma", duracaoMinutos: "5", descricao: "Desaceleração guiada, respiração e alongamentos leves, sem forçar amplitude.", atencoesFaixaEtaria: "Evite competição de flexibilidade e respeite limites individuais." },
] as const;

const PRATICAS_SUGERIDAS = [
  { tipo: "TECNICA", nome: "Revisão de base e postura", duracaoMinutos: "5", descricao: "Demonstre a posição, corrija alinhamento e faça todos repetirem antes de avançar.", atencoesFaixaEtaria: "Use referências simples e pausas frequentes com crianças menores." },
  { tipo: "TECNICA", nome: "Exercício em dupla", duracaoMinutos: "8", descricao: "Explique a sequência, organize pares compatíveis e acompanhe a troca de papéis.", atencoesFaixaEtaria: "Controle intensidade e diferença de tamanho; interrompa diante de desconforto." },
] as const;

export function AulaCurriculoForm({ loading = false, initialValues, onSubmit, itensCatalogo = [], conteudosBiblioteca = [], templates = [] }: AulaCurriculoFormProps) {
  const methods = useForm<AulaCurriculoFormData>({
    resolver: zodResolver(aulaCurriculoSchema),
    defaultValues: { ...AULA_DEFAULTS, ...initialValues },
  });

  const { register, handleSubmit, formState: { errors } } = methods;
  const { fields, append, remove } = useFieldArray({ control: methods.control, name: "blocos" });
  const blocos = methods.watch("blocos") ?? [];
  const [buscaBiblioteca, setBuscaBiblioteca] = useState("");
  const conteudosExibidos = useMemo(() => conteudosBiblioteca.filter((conteudo) => `${conteudo.nome} ${conteudo.tipo} ${conteudo.modalidade.nome}`.toLocaleLowerCase("pt-BR").includes(buscaBiblioteca.toLocaleLowerCase("pt-BR"))).slice(0, 8), [buscaBiblioteca, conteudosBiblioteca]);

  useEffect(() => {
    methods.reset({ ...AULA_DEFAULTS, ...initialValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  function adicionarMomento(modelo: (typeof MOMENTOS_SUGERIDOS)[number] = MOMENTOS_SUGERIDOS[0]) {
    append({ ...modelo, rounds: "4", duracaoRoundMinutos: "4", descansoSegundos: "60", anuncio: "" });
  }

  function adicionarPratica(modelo: (typeof PRATICAS_SUGERIDAS)[number]) {
    append({ ...modelo, rounds: "4", duracaoRoundMinutos: "4", descansoSegundos: "60", anuncio: "" });
  }

  function adicionarDoCatalogo(item: ItemCatalogoPedagogico) {
    const tipo: TipoBlocoCurriculo = item.tipo === "MOMENTO" ? item.tipoBloco ?? "AQUECIMENTO" : "TECNICA";
    append({
      tipo,
      nome: item.nome,
      duracaoMinutos: String(Math.max(1, Math.round(item.duracaoPrevistaSegundos / 60))),
      descricao: item.descricao ?? "",
      atencoesFaixaEtaria: item.atencoesFaixaEtaria ?? "",
      rounds: "4",
      duracaoRoundMinutos: "4",
      descansoSegundos: "60",
      anuncio: "",
    });
  }

  function adicionarConteudo(conteudo: ConteudoBiblioteca) {
    append({ tipo: "TECNICA", nome: conteudo.nome, duracaoMinutos: String(Math.max(1, Math.round(conteudo.duracaoSugeridaSegundos / 60))), descricao: conteudo.passoAPasso || conteudo.descricao || "", atencoesFaixaEtaria: conteudo.pontosAtencao || "", conteudoTecnicoId: String(conteudo.id), rounds: "4", duracaoRoundMinutos: "4", descansoSegundos: "60", anuncio: "" });
  }

  function aplicarTemplate(template: TemplatePlanejamento) {
    template.etapas.forEach((etapa) => append({ tipo: etapa.tipo, nome: etapa.titulo, duracaoMinutos: String(Math.max(1, Math.round(etapa.duracaoSegundos / 60))), descricao: etapa.descricao ?? "", atencoesFaixaEtaria: "", rounds: "4", duracaoRoundMinutos: "4", descansoSegundos: "60", anuncio: "" }));
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Título da Aula" {...register("titulo")} />
            <ErrorMessage message={errors.titulo?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <MemorandoPedagogico label="Objetivo da aula" value={methods.watch("objetivo") ?? ""} onChange={(value) => methods.setValue("objetivo", value)} placeholder="Defina o que os alunos devem praticar ou compreender hoje." sugestoes={["Reconhecer a posição e executar a entrada com segurança.", "Praticar a sequência com cooperação e controle de intensidade.", "Aplicar o conteúdo em situação orientada, respeitando os limites da turma."]} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Duração (minutos)" type="number" {...register("duracaoMinutos")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <MemorandoPedagogico label="Jogos e dinâmicas" value={methods.watch("jogosSugeridos") ?? ""} onChange={(value) => methods.setValue("jogosSugeridos", value)} placeholder="Registre uma dinâmica por linha ou escreva uma nova proposta." sugestoes={["Jogo de equilíbrio e base.", "Desafio de deslocamento em dupla.", "Circuito técnico com rodízio de estações."]} />
          </FormGridItem>

          <FormGridItem span={2}>
            <MemorandoPedagogico label="Orientação geral ao professor" value={methods.watch("descricao") ?? ""} onChange={(value) => methods.setValue("descricao", value)} placeholder="Registre a intenção, a organização e os combinados desta aula." sugestoes={["Comece com uma demonstração breve e mantenha grupos pequenos.", "Priorize qualidade de execução antes de aumentar velocidade ou intensidade.", "Reserve um momento final para revisar aprendizados e ouvir a turma."]} />
          </FormGridItem>
        </FormGrid>

        <section className="curriculo-blocos-editor" aria-labelledby="titulo-blocos-aula">
          <div className="curriculo-blocos-cabecalho">
            <div>
              <h3 id="titulo-blocos-aula">Blocos cronometrados</h3>
              <p>Defina a ordem e o tempo dos jogos, pausas e rounds.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => append({ tipo: "AQUECIMENTO", nome: "", duracaoMinutos: "5", rounds: "4", duracaoRoundMinutos: "4", descansoSegundos: "60", anuncio: "" })}>
              Novo momento
            </Button>
          </div>

          <div className="curriculo-momentos-sugeridos" aria-label="Momentos pré-cadastrados">
            {MOMENTOS_SUGERIDOS.map((momento) => (
              <Button key={momento.nome} type="button" variant="secondary" onClick={() => adicionarMomento(momento)}>
                + {momento.nome}
              </Button>
            ))}
          </div>
          <div className="curriculo-momentos-sugeridos" aria-label="Posições e exercícios pré-cadastrados">
            {PRATICAS_SUGERIDAS.map((pratica) => <Button key={pratica.nome} type="button" variant="secondary" onClick={() => adicionarPratica(pratica)}>+ {pratica.nome}</Button>)}
          </div>

          {templates.length > 0 && <div className="curriculo-catalogo-itens"><strong>Começar com um modelo</strong><div>{templates.map((template) => <Button key={template.id} type="button" variant="secondary" onClick={() => aplicarTemplate(template)}>Usar {template.nome}</Button>)}</div></div>}

          <div className="curriculo-biblioteca-rapida">
            <div><strong>Biblioteca técnica</strong><Input aria-label="Buscar conteúdo técnico" placeholder="Buscar posição, técnica ou exercício" value={buscaBiblioteca} onChange={(event) => setBuscaBiblioteca(event.target.value)} /></div>
            {conteudosExibidos.length > 0 && <div className="curriculo-biblioteca-lista">{conteudosExibidos.map((conteudo) => <button key={conteudo.id} type="button" onClick={() => adicionarConteudo(conteudo)}><span><strong>{conteudo.nome}</strong><small>{conteudo.modalidade.nome} · {conteudo.tipo.toLocaleLowerCase("pt-BR")}</small></span><span>{Math.ceil(conteudo.duracaoSugeridaSegundos / 60)} min</span></button>)}</div>}
          </div>

          {itensCatalogo.length > 0 && (
            <div className="curriculo-catalogo-itens" aria-label="Catálogo pedagógico">
              {(["POSICAO", "EXERCICIO", "MOMENTO"] as const).map((tipo) => {
                const itens = itensCatalogo.filter((item) => item.tipo === tipo);
                if (!itens.length) return null;
                const rotulo = tipo === "POSICAO" ? "Posições" : tipo === "EXERCICIO" ? "Exercícios" : "Momentos";
                return <div key={tipo}><strong>{rotulo}</strong><div>{itens.map((item) => <Button key={item.id} type="button" variant="secondary" onClick={() => adicionarDoCatalogo(item)}>+ {item.nome} · {Math.ceil(item.duracaoPrevistaSegundos / 60)} min</Button>)}</div></div>;
              })}
            </div>
          )}
          {fields.map((field, index) => {
            const tipo = blocos[index]?.tipo;
            return (
              <div className="curriculo-bloco-linha" key={field.id}>
                <Select label="Tipo" options={TIPOS_BLOCO} {...register(`blocos.${index}.tipo`)} />
                <Input label="Nome" {...register(`blocos.${index}.nome`)} />
                <Input label={tipo === "SPARRING" ? "Duração do round (min)" : "Duração (min)"} type="number" min="1" {...register(tipo === "SPARRING" ? `blocos.${index}.duracaoRoundMinutos` : `blocos.${index}.duracaoMinutos`)} />
                {tipo === "SPARRING" && <Input label="Rounds" type="number" min="1" {...register(`blocos.${index}.rounds`)} />}
                {tipo === "SPARRING" && <Input label="Descanso (s)" type="number" min="0" {...register(`blocos.${index}.descansoSegundos`)} />}
                {tipo === "PAUSA" && <Input label="Anúncio" {...register(`blocos.${index}.anuncio`)} />}
                <input type="hidden" {...register(`blocos.${index}.conteudoTecnicoId`)} />
                <MemorandoPedagogico className="curriculo-bloco-descricao" label="Como conduzir" value={blocos[index]?.descricao ?? ""} onChange={(value) => methods.setValue(`blocos.${index}.descricao`, value)} placeholder="O que demonstrar, como organizar e quando avançar." rows={2} sugestoes={["Demonstre, deixe a turma experimentar e corrija um ponto por vez.", "Organize pares compatíveis e alterne os papéis na metade do tempo.", "Faça uma pausa breve para checar compreensão antes de avançar."]} />
                <MemorandoPedagogico className="curriculo-bloco-atencoes" label="Cuidados e adaptações" value={blocos[index]?.atencoesFaixaEtaria ?? ""} onChange={(value) => methods.setValue(`blocos.${index}.atencoesFaixaEtaria`, value)} placeholder="Segurança, intensidade, pares e adaptações por idade." rows={2} sugestoes={["Reduza a intensidade e use instruções curtas para os menores.", "Evite pares com diferença grande de tamanho ou experiência.", "Interrompa diante de desconforto e ofereça uma variação mais simples."]} />
                <Button type="button" variant="danger" onClick={() => remove(index)}>Remover</Button>
              </div>
            );
          })}
        </section>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : initialValues ? "Salvar Alterações" : "Cadastrar Aula"}
        </Button>
      </form>
    </FormProvider>
  );
}
