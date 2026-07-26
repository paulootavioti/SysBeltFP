declare namespace Express {

  export interface Request {

    user: {
      id: number;
      perfil: string;
      unidadeId: number | null;
    };

  }

}