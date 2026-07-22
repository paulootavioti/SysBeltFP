import { z } from "zod";

export const updatePerfilSchema = z.object({
  perfil: z.enum(["ADMIN", "PROFESSOR", "RECEPCAO"]),
});
