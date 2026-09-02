# Mensageria Meta - Etapa 1

## Entregue

- Diretório global `ContaMensageriaDiretorio`, sem tokens ou dados de contatos.
- Canais WhatsApp e Instagram por unidade e referências para o cofre.
- Webhooks com HMAC SHA-256 sobre o corpo cru.
- Inbox transacional idempotente por canal e ID da mensagem Meta.
- Persistência de conversas e mensagens, sem execução de bot.
- API autenticada de leitura em `GET /mensageria/conversas` e `GET /mensageria/conversas/:id`.
- Consumidor protegido em `POST /mensageria/inbox/processar` com `X-Cron-Secret`.

## Ativação

1. Aplicar `control-plane/prisma/migrations/20260826020000_diretorio_mensageria`.
2. Aplicar `prisma/migrations/20260826021000_mensageria_etapa_1` em cada tenant.
3. Criar uma `ContaMensageriaDiretorio` com tipo, identificador da conta Meta e `appSecretRef`.
4. Criar o `CanalMensageria` correspondente no tenant, com a unidade correta e referências de token.
5. Configurar `META_WHATSAPP_VERIFY_TOKEN_REF` e/ou `META_INSTAGRAM_VERIFY_TOKEN_REF`.
6. Cadastrar na Meta os endpoints `GET/POST /webhooks/meta/whatsapp` ou `/instagram`.
7. Agendar o consumidor com o host do tenant e `X-Cron-Secret`.

Referências `env:NOME` são aceitas somente como facilidade operacional local. Em produção, use IDs do AWS Secrets Manager. O conteúdo de mensagens, identificadores de contatos e segredos não deve ser registrado em logs.

## Etapa 2 - Motor do bot

- Fluxo versionado por unidade e sessão persistente por conversa.
- Máquina de estados isolada do transporte, com passos condicionais para responsável e Instagram.
- Escape imediato para atendente em pedidos de pessoa, preço, plano ou desconto.
- Consentimento LGPD com texto exato, versão e canal de origem.
- Deduplicação por E.164 na conta antes de criar lead.
- Vínculo a lead ou aluno existente e identificação de ex-aluno sem reativação prematura.
- Criação transacional do lead com canal de captação, rodízio, SLA de 15 minutos e timeline.
- Um único lembrete após 24 horas, processado por `POST /mensageria/bot/lembrar`.

As mensagens produzidas pelo bot ficam em `PENDENTE`. O despacho pela Meta e a resposta do atendente pertencem à Etapa 3, junto da caixa de entrada.

## Etapa 3 - Caixa de entrada e despacho

- Página autenticada `/atendimento` com lista, filtros, thread e painel contextual.
- Layout de três colunas no desktop e rolagem horizontal interna em telas estreitas.
- PROFESSOR em modo somente leitura; DONO, ADMIN e RECEPCAO podem assumir, responder e encerrar.
- Respostas rápidas, estados de entrega e falha sanitizada visíveis na thread.
- Resposta do atendente registrada na timeline e despachada imediatamente pela Meta.
- Mensagens pendentes do bot despachadas por `POST /mensageria/mensagens/despachar`.
- Badge de conversas não lidas integrado ao contador do menu.
- Token recuperado por referência de cofre; nenhum token, telefone ou conteúdo é escrito em log.

## Etapa 4 - Conversão e reativação

- Avanço controlado de estágio, com transições inválidas bloqueadas e motivo obrigatório para perda.
- Agendamento de aula experimental com data futura e registro na timeline do lead.
- Conversão transacional de lead em aluno, reaproveitando nome, telefone, e-mail e unidade.
- Reativação do cadastro existente para ex-alunos, preservando ID, faixa, grau e histórico de graduações.
- Transferência do consentimento aceito no bot com texto, versão, IP, dispositivo e instante originais.
- Idempotência para impedir alunos duplicados em novas tentativas de conversão.
- Auditoria da conversão ou reativação e vínculo das conversas ao aluno.
- Painel comercial na caixa de entrada com alerta de SLA, ações e timeline do lead.
- Isolamento por conta e unidade aplicado às novas operações.

## Etapa 5 - Fluxo dos bots

- Aba administrativa `Fluxo dos bots` disponível para DONO e ADMIN em `/atendimento`.
- Visão das conexões WhatsApp e Instagram com status, conta mascarada e leads captados nos últimos 30 dias.
- Editor dos sete passos com textos, tipos, campos de destino, opções e regras condicionais.
- Publicação cria uma nova versão e desativa a anterior; versões usadas por sessões existentes são preservadas.
- Estrutura, opções e campos do fluxo são fixos para proteger a interpretação das respostas; apenas os textos operacionais são editáveis.
- Texto legal do consentimento permanece versionado no código e não pode ser substituído pelo editor.
- Motor do bot utiliza efetivamente os textos da versão vinculada à sessão.
- Regras de transferência ficam visíveis junto do editor e continuam com precedência sobre o roteiro.
- APIs administrativas isoladas por unidade em `GET|PUT /mensageria/bot/fluxos` e `GET /mensageria/canais-mensageria`.

## Etapa 6 - Onboarding Meta por tenant

- Assistente de conexão e reconexão por unidade na aba `Fluxo dos bots`.
- WhatsApp Embedded Signup recebe no navegador apenas código temporário, `phone_number_id` e `waba_id`.
- Backend troca o código pelo token, confere o aplicativo emissor, valida a conta e assina `subscribed_apps` da WABA.
- Token do tenant é escrito no AWS Secrets Manager; banco e respostas HTTP guardam somente `tokenRef`.
- Diretório global é sincronizado por endpoint interno autenticado e bloqueia uma conta Meta vinculada a outro tenant.
- Canal só muda para `CONECTADO` depois de Meta, cofre e Control Plane confirmarem a operação.
- Estados `PENDENTE`, `VALIDANDO`, `CONECTADO`, `ERRO` e `INATIVO` permitem reconexão sem falso positivo na interface.
- Desativação remove a conta do diretório de webhooks antes de inativar o canal local.
- Conta e identificadores são mascarados na listagem; código OAuth, token e app secret não são registrados.

### Configuração de implantação

1. Criar o aplicativo empresarial na Meta e habilitar WhatsApp e Instagram Messaging.
2. Criar uma configuração de Embedded Signup e cadastrar o domínio e a URI de redirecionamento do painel.
3. Definir no frontend `VITE_META_APP_ID`, `VITE_META_WHATSAPP_CONFIG_ID` e `VITE_META_GRAPH_API_VERSION`.
4. Gravar o app secret no AWS Secrets Manager e definir `META_APP_SECRET_REF` com sua referência.
5. Definir `META_APP_ID`, `META_OAUTH_REDIRECT_URI`, `META_TENANT_SECRETS_PREFIX` e as referências dos verify tokens na API.
6. Conceder à API somente `secretsmanager:GetSecretValue`, `CreateSecret` e `PutSecretValue` no prefixo configurado.
7. Usar o mesmo segredo de integração em `TENANT_DIRECTORY_SECRET` na API e `CONTROL_PLANE_DIRECTORY_SECRET` no Control Plane.
8. Publicar no Control Plane o endpoint interno `PUT /api/diretorio/v1/tenants/mensageria` e aplicar a migration `20260826025000_onboarding_meta` em todos os tenants.

## Etapa 7 - Instagram e diagnóstico Meta

- Instagram Business Login em popup com `state` aleatório validado no retorno.
- Código temporário trocado exclusivamente no backend por token curto e, em seguida, token de longa duração.
- Identificador da conta Instagram descoberto pela resposta da Meta, sem confiar em ID enviado pelo navegador.
- Validação de identidade e assinatura de `messages`, `messaging_postbacks` e `message_reactions` em `subscribed_apps`.
- Envio do Instagram direcionado ao host `graph.instagram.com`; WhatsApp permanece em `graph.facebook.com`.
- Diagnóstico por canal valida token, conta, assinatura e registro no diretório global.
- Falha de diagnóstico inativa o canal local e tenta removê-lo do diretório antes de solicitar reconexão.
- Ação `Diagnosticar` disponível nos cards de conexão sem expor token ou resposta sensível da Meta.

Para o Instagram, configure também `META_INSTAGRAM_APP_ID`, `META_INSTAGRAM_APP_SECRET_REF`,
`VITE_META_INSTAGRAM_APP_ID` e `VITE_META_INSTAGRAM_REDIRECT_URI`. A URI deve coincidir exatamente
entre o aplicativo Meta, a API e o frontend.

## Etapa 8 - Ciclo de credenciais

- Validade, próxima renovação, último diagnóstico e versão da credencial persistidos como metadados operacionais.
- Token longo do Instagram renovado sete dias antes da expiração no mesmo segredo do AWS Secrets Manager.
- Nova credencial é validada e tem os webhooks reassinados antes de substituir a versão anterior no cofre.
- Falha transitória de renovação mantém o canal ativo e agenda retry em seis horas.
- Diagnóstico diário valida canais conectados; credencial inválida inativa o canal e o diretório global.
- Cards de conexão exibem validade, data do último diagnóstico e versão, sem revelar token ou referência do cofre.
- Rotina protegida disponível em `POST /mensageria/canais-mensageria/manter` com `X-Cron-Secret`.

Agende a manutenção pelo menos uma vez ao dia para cada tenant ativo. A execução é idempotente e processa
no máximo 50 canais por chamada; ambientes com mais canais podem repetir a chamada até `encontrados` retornar zero.

## Etapa 9 - Entrega confiável e janela do WhatsApp

- Respostas da Meta são classificadas por código operacional sanitizado, sem persistir mensagem de erro, telefone ou conteúdo retornado pelo provedor.
- O erro `131047` é apresentado como janela de atendimento de 24 horas encerrada e não entra em retentativa automática.
- Falhas transitórias são repetidas até três vezes, com espera exponencial limitada a 30 minutos.
- Reserva atômica de dois minutos impede despacho duplicado quando mais de um worker executa simultaneamente.
- Mensagens falhadas podem ser reenviadas manualmente pela caixa de entrada.
- A conversa informa se a janela de atendimento do WhatsApp está aberta e a data limite calculada pela última mensagem recebida.
- Fora da janela, a composição de texto é substituída pela seleção de um template aprovado.
- DONO/ADMIN pode consultar o catálogo de templates por canal e atualizar os dados diretamente da Meta.
- Templates são enviados pela Cloud API no formato oficial; a prévia cadastrada permanece visível na thread e na auditoria.

O SysBelt não aprova templates na Meta. Crie e acompanhe a aprovação no WhatsApp Manager, depois sincronize o
canal. Mantenha o cron de despacho
`POST /mensageria/mensagens/despachar` ativo em intervalos curtos para executar as retentativas agendadas.

## Etapa 10 - Sincronização de templates WhatsApp

- O `waba_id` validado no Embedded Signup passa a ser persistido como identificador operacional não secreto do canal.
- Templates são importados diretamente da Graph API com paginação, status, categoria, idioma e componentes.
- Apenas templates `APPROVED` e compatíveis ficam disponíveis para envio; rejeitados, pausados ou removidos são desativados automaticamente.
- Cabeçalhos de mídia e botões com URL dinâmica são importados para visibilidade, mas bloqueados para envio até terem composição própria.
- Variáveis sequenciais do corpo (`{{1}}`, `{{2}}`) geram campos obrigatórios na caixa de entrada.
- A API valida quantidade, conteúdo e tamanho dos parâmetros antes de persistir a mensagem.
- O envio usa componentes oficiais do WhatsApp e a thread mantém uma prévia com os valores aplicados.
- Sincronização imediata disponível no painel e rotina protegida em `POST /mensageria/templates/sincronizar` com `X-Cron-Secret`.
- Token permanece no cofre e é enviado somente no cabeçalho de autorização; cursores de paginação não reutilizam URLs com credenciais.

Após implantar esta etapa, reconecte uma vez os canais WhatsApp existentes para persistir o `waba_id`. Agende a
sincronização pelo menos diariamente e também após criar ou editar templates no WhatsApp Manager.

## Etapa 11 - Mídias recebidas

- Webhooks normalizam referências de imagens, áudios, vídeos e documentos sem baixar arquivos dentro da transação de entrada.
- Mensagens registram estado `PENDENTE`, `PROCESSANDO`, `DISPONIVEL` ou `FALHOU` para a mídia associada.
- Worker protegido em `POST /mensageria/midias/processar` resolve a referência, baixa e armazena o arquivo no Netlify Blobs.
- Downloads aceitam somente HTTPS em domínios controlados pela Meta, impedindo uso do webhook para SSRF.
- Arquivos são limitados a 16 MB e a uma lista fechada de MIME para imagem, áudio, vídeo, PDF, texto e documentos Word.
- Token do canal é recuperado do cofre e enviado somente no cabeçalho de autorização do WhatsApp.
- Reserva atômica impede dois workers de processarem o mesmo anexo; falhas transitórias têm até quatro tentativas.
- URLs temporárias de origem são removidas após armazenamento e nunca são devolvidas ao frontend.
- A API entrega somente URL interna assinada, com validade curta, para usuários autorizados na conversa.
- A caixa de entrada renderiza imagem, player de áudio/vídeo, download de documento e estados de processamento ou indisponibilidade.

Agende `POST /mensageria/midias/processar` com `X-Cron-Secret` em intervalos curtos. Em produção, configure
`NETLIFY_BLOBS_SITE_ID` e `NETLIFY_BLOBS_TOKEN`, já utilizados pelo módulo de uploads. O envio de anexos pela
equipe será tratado na etapa seguinte; esta etapa cobre recebimento, armazenamento e visualização.

## Etapa 12 - Envio de anexos

- Endpoint multipart autenticado em `POST /mensageria/conversas/:id/anexos`, limitado a um arquivo de até 16 MB.
- Isolamento por unidade, conversa aberta e janela de 24 horas do WhatsApp são validados novamente no backend.
- Arquivos são gravados pelo serviço dedicado no prefixo privado `mensageria`; o upload genérico não recebeu permissão de escrita nesse prefixo.
- WhatsApp envia imagens, áudios, vídeos e documentos; Instagram envia imagens, áudios e vídeos.
- Documentos no Instagram são bloqueados antes do armazenamento para evitar arquivo órfão e falso envio.
- Links entregues à Meta usam `PUBLIC_API_URL` e assinatura temporária, sem tornar o Blob público permanentemente.
- Legendas são enviadas junto de imagens, vídeos e documentos no WhatsApp; o composer não oferece legenda para anexos do Instagram.
- A mensagem é criada antes do envio, participa da reserva e das retentativas da Etapa 9 e mantém status visível na thread.
- Cada anexo do atendimento gera evento na timeline do lead sem registrar nome, conteúdo ou URL em logs.
- Composer usa seletor nativo, nome/tamanho do arquivo, remoção antes do envio e limite coerente com a API.

Em produção, defina `PUBLIC_API_URL` com a origem pública que atende `/uploads`, incluindo o prefixo `/api` quando
aplicável, por exemplo `https://app.sysbelt.com.br/api`. A Meta precisa conseguir acessar essa URL por HTTPS.
