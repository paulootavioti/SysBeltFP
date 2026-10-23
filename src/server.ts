import { app } from "./app";
import { logger } from "./shared/observability/logger";

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  logger.info("servidor_iniciado", { porta: port });
});
