# Backup e restauração

Duas camadas, para dois tipos de problema:

| Camada | Protege contra | RPO (quanto se perde) | RTO (quanto demora) |
|---|---|---|---|
| **Histórico do Neon** (restauração para um instante, em branch) | Dado apagado ou corrompido por erro de operação ou de deploy | Minutos: qualquer instante dentro da janela de histórico do plano | Minutos para criar o branch; mais o tempo de apontar a aplicação, se for o caso |
| **Backup lógico diário** (`npm run db:backup`) | Problema com a própria conta ou região do Neon, ou incidente descoberto depois da janela de histórico | Até 24 h (frequência do backup) | O medido no teste de restauração (tabela abaixo) |

A janela de histórico depende do plano do Neon: confira no painel do projeto
(Settings → Storage → History retention) e anote aqui ao configurar.

## Restaurar pelo histórico do Neon (primeira opção)

Nunca restaure direto em cima da produção. No painel do Neon:

1. **Branches → Create branch**, origem `main`, opção de **ponto no tempo**
   anterior ao incidente.
2. Confira os dados no branch novo, com a string de conexão dele.
3. Decida: copiar só o que se perdeu para a produção, ou promover o branch
   (trocar `DATABASE_URL`/`DIRECT_DATABASE_URL` no Netlify e fazer novo deploy).

## Backup lógico

Requer `pg_dump`, `pg_restore` e `psql` na mesma versão maior do servidor ou
mais nova (no Mac: `brew install libpq && brew link --force libpq`).

```bash
ORIGEM_DATABASE_URL="<DIRECT_DATABASE_URL de produção>" npm run db:backup
```

- Use a conexão **direta** (hostname sem `-pooler`); o script recusa o pooler.
- Gera `backups/sysbelt-<data>.dump` e o `.sha256` ao lado. A pasta
  `backups/` não vai para o Git.
- **Guarde os dois arquivos fora da máquina**, num armazenamento com acesso
  restrito e versões (o dump tem dados pessoais de alunos e responsáveis).

## Teste de restauração (mensal)

Um backup só vale se a restauração foi testada. Crie um banco **vazio e
separado** (no Neon, um branch novo sem dados ou um banco novo; local,
`createdb restauracao_teste`) e rode:

```bash
DESTINO_DATABASE_URL="<banco vazio>" npm run db:restaurar-isolado -- backups/sysbelt-<data>.dump
```

O script:

1. **Recusa** destino igual a `DATABASE_URL`, `DIRECT_DATABASE_URL` ou
   `ORIGEM_DATABASE_URL` (lidas do ambiente e do `.env`) e destino que já
   tenha tabelas.
2. Confere o checksum do backup.
3. Restaura com `pg_restore` e mede o tempo.
4. Confere se as migrations do código atual batem com o schema restaurado,
   conta as tabelas principais e procura registros órfãos (unidade sem conta,
   aluno sem unidade).
5. Grava `backups/restauracao-<data>.json` e só aprova se tudo bateu.

Compare as contagens do relatório com as da produção no momento do backup.
Depois do teste, apague o banco de restauração.

## Registro dos testes

| Data | Quem | Tamanho do backup | Duração do backup | Duração da restauração (RTO) | Aprovado | Observações |
|---|---|---|---|---|---|---|
| 26/10/2026 | Teste local (banco de testes) | 0,32 MB | 0,2 s | 2,7 s | Sim | Valida os scripts; não substitui o teste com os dados de produção |
| | | | | | | |
