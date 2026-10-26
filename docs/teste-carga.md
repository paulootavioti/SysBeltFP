# Teste de carga

Critério do piloto: com 50 usuários simultâneos por 5 minutos, **menos de 1%
de falha HTTP** e **p95 abaixo de 800 ms em cada rota**. O k6 reprova a
execução sozinho se o critério não for atingido.

## Onde rodar

**Nunca em produção.** A carga disputa o banco com as academias e cria
registros (aulas programadas, apagadas em seguida). O `npm run carga` recusa
os domínios de produção (`HOSTS_DE_PRODUCAO` em `scripts/carga.mjs`).

Como o projeto não tem ambiente de homologação, há duas opções:

| Opção | Mede | Como montar |
|---|---|---|
| **Homologação no Netlify (recomendado)** | O comportamento real: cold start da function, Neon pela rede, limites do plano | No Neon, crie um branch a partir da produção (os dados vêm junto). No Netlify, publique um *branch deploy* (ex.: branch `homologacao`) com `DATABASE_URL` e `DIRECT_DATABASE_URL` apontando para o branch do Neon, usando variáveis com escopo só para esse branch. `BASE_URL=https://homologacao--sysbeltfp.netlify.app/api` |
| **API local** | Gargalos de código e de consulta, sem rede nem cold start | Restaure um backup num banco local (`docs/backup-restauracao.md`), rode `npm run dev` e use `BASE_URL=http://localhost:3333` |

Antes de rodar na homologação, confira que o branch deploy não usa o banco
de produção: o `/api/health/ready` mostra a versão, mas não o banco. Confira
no painel do Netlify as variáveis do branch.

## Preparação

No ambiente escolhido, deixe pronto:

- um usuário **ADMIN sem 2FA**, só para o teste (`LOGIN_EMAIL`, `LOGIN_SENHA`);
- para testar escrita, o id de uma turma de teste dessa unidade (`TURMA_ID`);
- para testar o webhook, o id de uma forma de pagamento Mercado Pago (`FORMA_PAGAMENTO_ID`).

## Execução

Instale o k6 (`brew install k6`) ou tenha o Docker rodando (o script usa a
imagem `grafana/k6` quando o k6 não está instalado).

```bash
BASE_URL=https://homologacao--sysbeltfp.netlify.app/api \
LOGIN_EMAIL=carga@exemplo.com LOGIN_SENHA=... \
TURMA_ID=12 FORMA_PAGAMENTO_ID=3 \
npm run carga
```

Para um ensaio curto antes da execução completa: `VUS=5 DURACAO=30s npm run carga`.

## O que é medido

| Cenário | Requisições | Ritmo |
|---|---|---|
| Leitura | `GET /health`, `GET /dashboard`, `GET /alunos` (página de 20), `GET /aulas` | Sobe até `VUS` (50) usuários, cada um repetindo a sequência a cada ~1 s |
| Login | `POST /auth/login` | 2 por segundo (o bcrypt é caro de propósito) |
| Escrita | `POST /aulas/programadas` e `DELETE` da mesma aula | 1 por segundo; só com `TURMA_ID` |
| Webhook | `POST /pagamentos/webhook/mercado_pago/:id` sem assinatura (espera 401) | 5 por segundo; só com `FORMA_PAGAMENTO_ID` |

O webhook vai sem assinatura de propósito. Com a assinatura válida, cada
requisição consultaria a API do Mercado Pago. O caminho medido é o de
qualquer notificação: localizar a forma de pagamento, decifrar o segredo e
verificar a assinatura.

Cada rota tem o próprio limite de p95 (`http_req_duration{rota:...}`). No
fim, o k6 mostra o p95 de cada uma e marca em vermelho a que passou de 800 ms.

## Registro

| Data | Ambiente | VUs/duração | Falhas HTTP | p95 pior rota | Aprovado | Observações |
|---|---|---|---|---|---|---|
| | | | | | | |

Rode fora do horário das academias. Se a homologação usa um branch do Neon,
apague o branch depois.
