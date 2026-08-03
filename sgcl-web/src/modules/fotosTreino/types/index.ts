export interface FotoTreino {
  id: number;
  aulaId: number;
  url: string;
  legenda: string;
  publicadaPorId: number;
  publicadaPor: { id: number; nome: string };
  publicadaEm: string;
  visivelNaLanding: boolean;
}

export interface PublicarFotosTreinoResultado {
  fotos: FotoTreino[];
  familiasPresentes: number;
}
