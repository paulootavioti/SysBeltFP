import { Request, Response, NextFunction } from "express";

import { ensureAuthenticated } from "./ensureAuthenticated";
import { urlFotoAssinadaValida } from "../../modules/uploads/services/assinarUrlFoto";

// Leitura de foto aceita dois caminhos:
//
// 1. URL assinada (`?exp=...&sig=...`) — o que um <img> consegue usar, já que
//    o navegador não manda header nenhum. É o caminho normal de exibição.
// 2. Header Authorization — mantém funcionando quem já busca a imagem via
//    axios (AuthenticatedImage no sgcl-web) e qualquer integração existente.
//
// Sem isso, toda foto renderizada com <img> voltava 401.
export async function ensureFotoAutorizada(req: Request, res: Response, next: NextFunction) {
  const chave = `${req.params.prefixo}/${req.params.arquivo}`;

  if (urlFotoAssinadaValida(chave, req.query.exp, req.query.sig)) {
    return next();
  }

  return ensureAuthenticated(req, res, next);
}
