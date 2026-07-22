// Teto de segurança para listagens que hoje não têm paginação real
// (sem navegação por página no frontend). Evita que uma tabela muito
// grande retorne milhares de linhas numa única resposta.
export const LIMITE_PADRAO_LISTAGEM = 500;
