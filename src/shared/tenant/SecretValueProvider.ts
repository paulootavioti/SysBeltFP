import { CreateSecretCommand, GetSecretValueCommand, PutSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export interface SecretValueProvider { obter(ref: string): Promise<string>; }

export class SecretValueProviderAws implements SecretValueProvider {
  constructor(private readonly cliente: Pick<SecretsManagerClient, "send"> = new SecretsManagerClient({})) {}

  async obter(ref: string): Promise<string> {
    // Referências env: permitem desenvolvimento local sem persistir segredo no banco.
    if (ref.startsWith("env:")) {
      const valor = process.env[ref.slice(4)]?.trim();
      if (!valor) throw new Error("SEGREDO_INDISPONIVEL");
      return valor;
    }
    try {
      const resposta = await this.cliente.send(new GetSecretValueCommand({ SecretId: ref }));
      if (!resposta.SecretString) throw new Error("vazio");
      return resposta.SecretString;
    } catch {
      throw new Error("SEGREDO_INDISPONIVEL");
    }
  }
}

export interface SecretWriteProvider { armazenar(ref: string, valor: string): Promise<void>; }

export class SecretWriteProviderAws implements SecretWriteProvider {
  constructor(private readonly cliente: Pick<SecretsManagerClient, "send"> = new SecretsManagerClient({})) {}

  async armazenar(ref: string, valor: string): Promise<void> {
    if (!ref || !valor) throw new Error("SEGREDO_INVALIDO");
    try {
      await this.cliente.send(new PutSecretValueCommand({ SecretId: ref, SecretString: valor }));
    } catch (erro) {
      const nome = erro && typeof erro === "object" && "name" in erro ? String(erro.name) : "";
      if (nome !== "ResourceNotFoundException") throw new Error("COFRE_INDISPONIVEL");
      try {
        await this.cliente.send(new CreateSecretCommand({ Name: ref, SecretString: valor, Description: "Token de canal Meta gerenciado pelo SysBelt" }));
      } catch {
        throw new Error("COFRE_INDISPONIVEL");
      }
    }
  }
}
