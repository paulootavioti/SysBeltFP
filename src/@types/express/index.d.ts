declare namespace Express {

  export interface Request {

    user: {
      id: number;
      perfil: string;
      unidadeId: number | null;
    };

    // Corpo cru da requisição, preenchido pelo `verify` do express.json
    // (ver app.ts). A assinatura do webhook da Meta é calculada sobre os
    // bytes originais — reserializar o JSON parseado não bate quando há
    // acento, porque a Meta escapa os não-ASCII.
    corpoCru?: Buffer;

  }

}