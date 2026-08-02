import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { ImageUpload } from "../../../components/ui/ImageUpload";

import { CATEGORIA_PRODUTO_LABEL, type Produto } from "../types";
import { produtoSchema, type ProdutoFormData, type VarianteFormData } from "../schema/produto.schema";

import "./ProdutoForm.css";

const OPCOES_CATEGORIA = Object.entries(CATEGORIA_PRODUTO_LABEL).map(([value, label]) => ({ value, label }));

interface ProdutoFormProps {
  produto?: Produto;
  loading?: boolean;
  onSubmit: (data: ProdutoFormData & { variantes: VarianteFormData[] }) => void;
}

export function ProdutoForm({ produto, loading = false, onSubmit }: ProdutoFormProps) {
  const methods = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: produto?.nome ?? "",
      categoria: produto?.categoria ?? "KIMONO",
      preco: produto?.preco !== undefined ? String(produto.preco) : "",
      descricao: produto?.descricao ?? "",
      imagemUrl: produto?.imagemUrl ?? "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const [variantes, setVariantes] = useState<VarianteFormData[]>(
    produto?.variantes.map((v) => ({ id: v.id, tamanho: v.tamanho, cor: v.cor ?? "", estoque: v.estoque })) ?? [
      { tamanho: "", cor: "", estoque: 0 },
    ]
  );
  const [erroVariantes, setErroVariantes] = useState("");

  function adicionarVariante() {
    setVariantes((atual) => [...atual, { tamanho: "", cor: "", estoque: 0 }]);
  }

  function removerVariante(indice: number) {
    setVariantes((atual) => atual.filter((_, i) => i !== indice));
  }

  function atualizarVariante(indice: number, campo: keyof VarianteFormData, valor: string | number) {
    setVariantes((atual) => atual.map((v, i) => (i === indice ? { ...v, [campo]: valor } : v)));
  }

  function handleSalvar(data: ProdutoFormData) {
    const variantesValidas = variantes.filter((v) => v.tamanho.trim());

    if (variantesValidas.length === 0) {
      setErroVariantes("Cadastre ao menos uma variante com tamanho preenchido.");
      return;
    }

    setErroVariantes("");
    onSubmit({ ...data, variantes: variantesValidas });
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleSalvar)} className="produto-form">
        <FormGrid columns={2}>
          <FormGridItem span={2}>
            <Input label="Nome" placeholder="Ex: Kimono Trançado" {...register("nome")} />
            <ErrorMessage message={errors.nome?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Select label="Categoria" options={OPCOES_CATEGORIA} {...register("categoria")} />
            <ErrorMessage message={errors.categoria?.message ?? ""} />
          </FormGridItem>

          <FormGridItem>
            <Input label="Preço" type="number" step="0.01" min="0" {...register("preco")} />
            <ErrorMessage message={errors.preco?.message ?? ""} />
          </FormGridItem>

          <FormGridItem span={2}>
            <Textarea label="Descrição" placeholder="Detalhes do produto (opcional)" {...register("descricao")} />
          </FormGridItem>

          <FormGridItem span={2}>
            <ImageUpload
              label="Foto do produto"
              prefixo="produtos"
              valorAtual={watch("imagemUrl")}
              onChange={(url) => setValue("imagemUrl", url ?? "")}
            />
          </FormGridItem>
        </FormGrid>

        <div className="produto-form-variantes">
          <div className="produto-form-variantes-cabecalho">
            <span>Variantes</span>
            <Button type="button" size="sm" variant="secondary" onClick={adicionarVariante}>
              + Variante
            </Button>
          </div>

          {variantes.map((variante, indice) => (
            <div key={indice} className="produto-form-variante-linha">
              <Input
                label="Tamanho"
                placeholder="Ex: M, A2, Único"
                value={variante.tamanho}
                onChange={(e) => atualizarVariante(indice, "tamanho", e.target.value)}
              />
              <Input
                label="Cor (opcional)"
                placeholder="Ex: Azul"
                value={variante.cor}
                onChange={(e) => atualizarVariante(indice, "cor", e.target.value)}
              />
              <Input
                label="Estoque"
                type="number"
                min="0"
                value={variante.estoque}
                onChange={(e) => atualizarVariante(indice, "estoque", Number(e.target.value))}
              />
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => removerVariante(indice)}
                disabled={variantes.length === 1}
              >
                Remover
              </Button>
            </div>
          ))}

          <ErrorMessage message={erroVariantes} />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : produto ? "Salvar Alterações" : "Cadastrar Produto"}
        </Button>
      </form>
    </FormProvider>
  );
}
