# Planejamento Pedagógico

## Objetivo

O ambiente organiza o ensino em uma cadeia única: **modalidade → currículo → módulo → aula planejada → blocos cronometrados**. Ele atende tanto a preparação administrativa quanto a consulta e a execução no Portal do Professor.

## Papéis e acesso

| Perfil | Acesso |
|---|---|
| ADMIN e DONO | Criam, editam, duplicam e removem currículos, módulos, aulas, catálogo, conteúdos próprios e modelos. |
| PROFESSOR | Cria e edita planejamento, catálogo e conteúdos próprios da unidade; consulta o planejamento no Portal do Professor. |
| RECEPCAO | Não acessa Planejamento Pedagógico. |

No Portal do Professor, a rota `/planejamento` exige autenticação. O atalho aparece na Home e o botão **Ver planejamento** aparece em Minhas turmas somente quando a turma possui um currículo vinculado.

## Configuração inicial

1. Cadastre ou edite uma modalidade da unidade.
2. Vincule-a a uma **Modalidade da biblioteca técnica**. O sistema tenta reconhecer nomes equivalentes, mas o seletor manual resolve variações como “Jiu-Jitsu Kids”.
3. Crie o currículo e associe-o à modalidade.
4. Crie módulos por faixa, idade ou etapa de evolução.
5. Vincule o currículo à turma.

Sem esse vínculo, o Portal do Professor mostra corretamente o estado “Nenhum currículo vinculado”.

## Formas de criar uma aula

### Aula assistida

É o fluxo recomendado para uma aula nova. O usuário escolhe conteúdos técnicos compatíveis com a modalidade, seleciona um modelo opcional e cria uma fila de blocos estruturados. O sistema calcula a duração, copia o roteiro de execução e leva cuidados/adaptações para a aula.

### Aula manual

Permite criar ou editar blocos diretamente. Todo conteúdo técnico associado é validado quanto à unidade e, quando a modalidade está mapeada, quanto à modalidade da biblioteca.

### Duplicação

Duplicar insere a cópia logo depois da aula de origem. A operação é transacional e desloca as aulas posteriores para preservar a ordem.

## Exportação e importação

Cada currículo pode ser exportado pela ação **Exportar**. A matriz completa pode ser baixada em **CSV**, **XLS** ou **PDF**. CSV e XLS preservam a matriz estruturada para nova importação; PDF é destinado à leitura e impressão.

A ação **Exportar matriz** reúne todos os currículos da unidade em um único arquivo. **Importar CSV/XLS** valida todos os itens antes de iniciar e cria todos os currículos em uma única transação: se um item inválido impedir a importação, nenhum currículo parcial é gravado. PDF não é importável, pois não conserva a estrutura necessária para reconstruir aulas e blocos com segurança.

A ação **Importar planejamento** sempre cria um novo currículo na unidade ativa; ela nunca atualiza ou remove um currículo existente. O arquivo usa o contrato `sysbelt-planejamento`, versão `1`, e é validado antes de qualquer gravação. A modalidade é reconhecida pelo nome na unidade de destino. Caso ela não exista, a importação permanece válida e informa que o currículo ficou sem modalidade para que o usuário a escolha depois.

IDs internos, conteúdos da biblioteca e modelos não são transportados entre unidades. Isso evita vínculos indevidos entre organizações; os blocos exportados preservam seus nomes, tempos, roteiro e cuidados para continuar operacionais após a importação.

## Blocos cronometrados

Tipos disponíveis: aquecimento, jogo, técnica, sparring, pausa e alongamento. Cada bloco possui duração e pode registrar rounds, descanso, anúncio, modo de condução e cuidados/adaptações.

O tempo total é compilado pela API. A interface alerta quando o roteiro excede a duração da turma ou a duração planejada.

## Biblioteca técnica e catálogo

### Biblioteca técnica

Conteúdos globais são somente leitura. Cada unidade pode copiá-los, criar conteúdos próprios, editá-los e desativá-los. Um conteúdo inclui objetivo, execução, pontos de atenção, cuidados/adaptações, faixa etária recomendada e duração sugerida.

A pesquisa é paginada no servidor e pode filtrar por modalidade local, idade e nível. Modelos de planejamento também são filtrados pela modalidade e possuem versão ao serem alterados.

### Catálogo pedagógico

Reúne posições, exercícios e momentos recorrentes da unidade. Ele acelera a criação de blocos, mas não substitui a Biblioteca técnica para conteúdos com roteiro detalhado.

## Memorandos e sugestões

Currículo, módulo, aula, técnica, blocos, catálogo e biblioteca usam o mesmo padrão de memorando:

- sugestões rápidas adequadas ao contexto;
- visual compacto no cadastro novo, sem caixa de texto aberta;
- **Cadastrar nova orientação** abre a escrita livre;
- itens em edição mostram o texto existente e permitem **Editar orientação**.

As sugestões não bloqueiam customização: o texto livre é sempre a fonte final salva.

## Portal do Professor

O Portal consome a fila compilada, não apenas técnicas legadas. Em celular, o professor vê duração por etapa, como conduzir e cuidados/adaptações. A aula em execução usa a mesma fila para acompanhar a sequência.

## Endpoints principais

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/curriculos` | Lista currículos estruturados da unidade. |
| GET | `/curriculos/:id/exportar` | Baixa um currículo no formato JSON versionado. |
| POST | `/curriculos/importar` | Valida e cria um novo currículo a partir do JSON exportado. |
| GET | `/curriculos/exportar-matriz-arquivo?formato=csv\|xls\|pdf` | Baixa a matriz nos formatos disponíveis. |
| POST | `/curriculos/importar-matriz-arquivo` | Importa CSV ou XLS de modo atômico. |
| POST | `/curriculos/aulas/assistida` | Cria roteiro estruturado a partir de conteúdos e modelo. |
| POST | `/curriculos/aulas/:id/duplicar` | Duplica aula e preserva ordem. |
| GET | `/biblioteca-pedagogica/conteudos/pesquisa` | Busca paginada de conteúdos técnicos. |
| POST/PUT/DELETE | `/biblioteca-pedagogica/conteudos` | Gerencia conteúdo próprio da unidade. |
| GET/POST/PUT/DELETE | `/biblioteca-pedagogica/templates` | Consulta e gerencia modelos da unidade. |

## Auditoria de 7 de outubro de 2026

Itens verificados: estrutura de dados, isolamento por unidade, compatibilidade de modalidade, duração, duplicação, catálogo, biblioteca, Portal do Professor, rotas e formulários.

Correções aplicadas nesta auditoria:

- edição manual de aula agora também bloqueia conteúdo técnico de modalidade incompatível;
- documentação anterior, centrada em técnicas e jogos legados, foi substituída por esta referência operacional;
- os memorandos seguem comportamento compacto consistente.

Melhoria recomendada para uma próxima etapa: criar um endpoint específico para o Portal do Professor que devolva somente os currículos vinculados às turmas do professor. Hoje a interface filtra as turmas corretamente, mas `GET /curriculos` continua escopado pela unidade para compatibilidade com o painel administrativo.

## Verificação de release

1. Execute `npx prisma migrate deploy`.
2. Execute `npm run typecheck`.
3. Execute `npm --prefix sgcl-web run build` e `npm --prefix sgcl-portal-professor run build`.
4. Confira uma turma com currículo vinculado no Portal do Professor.
5. Crie uma aula assistida e valide a duração, o roteiro e os cuidados no celular.
