import { Request, Response } from "express";
import { CategoriaProduto, StatusPedido } from "@prisma/client";

import { CreateProdutoService } from "./services/CreateProdutoService";
import { UpdateProdutoService } from "./services/UpdateProdutoService";
import { ListProdutosService } from "./services/ListProdutosService";
import { ToggleAtivoProdutoService } from "./services/ToggleAtivoProdutoService";
import { GetLojaKpisService } from "./services/GetLojaKpisService";
import { ListPedidosService } from "./services/ListPedidosService";
import { MarcarPedidoEntregueService } from "./services/MarcarPedidoEntregueService";
import { CancelarPedidoService } from "./services/CancelarPedidoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class LojaController {

  async create(req: Request, res: Response) {
    const service = new CreateProdutoService();

    const produto = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(produto);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateProdutoService();

    const produto = await service.execute(Number(id), req.body, req.user.unidadeId);

    return res.json(produto);
  }

  async list(req: Request, res: Response) {
    const service = new ListProdutosService();

    const { busca, categoria, ativo } = req.query;

    const produtos = await service.execute(req.user.unidadeId, {
      busca: typeof busca === "string" ? busca : undefined,
      categoria: typeof categoria === "string" ? (categoria as CategoriaProduto) : undefined,
      ativo: ativo === "true" ? true : ativo === "false" ? false : undefined,
    });

    return res.json(produtos);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoProdutoService();

    const produto = await service.execute(Number(id), req.user.unidadeId);

    return res.json(produto);
  }

  async kpis(req: Request, res: Response) {
    const service = new GetLojaKpisService();

    const kpis = await service.execute(req.user.unidadeId);

    return res.json(kpis);
  }

  async listPedidos(req: Request, res: Response) {
    const service = new ListPedidosService();

    const { status, busca } = req.query;

    const pedidos = await service.execute(req.user.unidadeId, {
      status: typeof status === "string" ? (status as StatusPedido) : undefined,
      busca: typeof busca === "string" ? busca : undefined,
    });

    return res.json(pedidos);
  }

  async marcarPedidoEntregue(req: Request, res: Response) {
    const { id } = req.params;

    const service = new MarcarPedidoEntregueService();

    const pedido = await service.execute(Number(id), req.user.unidadeId);

    return res.json(pedido);
  }

  async cancelarPedido(req: Request, res: Response) {
    const { id } = req.params;

    const service = new CancelarPedidoService();

    const pedido = await service.execute(Number(id), req.user.unidadeId);

    return res.json(pedido);
  }

}
