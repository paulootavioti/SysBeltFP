// Admin, Professor e Recepção podem estar vinculados a mais de uma unidade
// (só o SUPERADMIN monta essa lista) — Professor porque pode dar aula em
// mais de uma unidade/arena, em horários diferentes. SUPERADMIN nunca
// pertence a uma unidade específica, então fica de fora dessa lista.
export const PERFIS_MULTI_UNIDADE = ["ADMIN", "PROFESSOR", "RECEPCAO"];
