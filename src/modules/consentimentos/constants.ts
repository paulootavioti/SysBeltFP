// Versão do texto de política vigente. Trocar aqui quando a política de
// privacidade mudar: os consentimentos antigos continuam apontando pra
// versão que a pessoa de fato aceitou, que é o ponto de guardar isso.
export const VERSAO_POLITICA_ATUAL = "2026-01";

// Valor gravado pelo backfill da migration. Consentimento com esta versão
// veio do booleano antigo e NÃO tem evidência de coleta — a academia
// precisa recoletar antes de tratá-lo como válido.
export const VERSAO_POLITICA_MIGRADA = "migracao-inicial";
