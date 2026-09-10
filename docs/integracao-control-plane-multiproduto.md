# Integração multiproduto com o Control Plane

O SysBelt preserva a arquitetura 3.0 de banco compartilhado. O diretório do
Control Plane valida identidade e estado comercial; `secretRef` nunca escolhe
uma conexão no runtime e não é persistido localmente.

Quando `CONTROL_PLANE_DIRECTORY_MULTIPRODUCT_ENABLED=true`, requisições
autenticadas extraem o slug somente de um domínio listado em
`SYSBELT_TENANT_DOMAINS`, consultam
`/api/diretorio/v1/produtos/sysbelt/tenants/{slug}` com a credencial exclusiva
do produto e confirmam que o `tenantKey` remoto coincide com a `Conta` local.

Enquanto não houver domínio próprio, um host gratuito pode ser associado de
forma explícita ao slug do tenant, sem aceitar slug informado pelo navegador:

```env
SYSBELT_TENANT_HOST_MAP='{"sysbeltfp.netlify.app":"academia-centro"}'
```

O mapa exige correspondência exata do hostname. Em produção comercial, prefira
subdomínios derivados de `SYSBELT_TENANT_DOMAINS`, como
`academia-centro.app.sysbelt.com.br`.

O cache respeita 60 segundos para `ATIVO`, 15 segundos para suspensos e cinco
segundos para `404`. Respostas `401` e `5xx` não são cacheadas. Se o diretório
estiver indisponível, somente uma concessão local `ATIVO`, assinada e ainda
válida mantém o acesso; sem ela, a aplicação falha fechada.

`TENANT_DIRECTORY_SECRET` permanece apenas para a integração legada de
mensageria, que usa um contrato específico e não resolve o tenant operacional.
Seu uso não deve ser ampliado e sua remoção depende da migração das rotas de
mensageria no Control Plane.

Snapshots continuam usando apenas unidades e contagens agregadas, assinadas
com a chave privada do tenant. Documento, contato e identificadores de alunos
nunca atravessam essa fronteira.
