import { prisma } from "../../../shared/database/prisma";

export class DeleteAulaProgramadaService {
  async execute(id: number) {
    await prisma.aulaProgramada.delete({ where: { id } });
  }
}
