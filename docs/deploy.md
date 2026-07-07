# Deploy

Versão: 1.0

Última atualização: Julho/2026

---

# Objetivo

Este documento descreve o processo oficial de implantação (Deploy) do SGCL Kids.

Seu objetivo é garantir que qualquer desenvolvedor consiga publicar uma nova versão do sistema de forma segura, reproduzível e documentada.

---

# Ambientes

O SGCL possui três ambientes.

## Desenvolvimento

Objetivo

Desenvolvimento diário.

Banco

SQLite

Frontend

Vite

Backend

Node.js

---

## Homologação

Objetivo

Testes antes da produção.

Banco

PostgreSQL

Servidor

Docker

---

## Produção

Objetivo

Uso oficial da academia.

Banco

PostgreSQL

Servidor

Docker

HTTPS

Backup automático

Monitoramento

---

# Estrutura

```
Internet

↓

Nginx

↓

Frontend React

↓

API Express

↓

PostgreSQL
```

---

# Tecnologias

Frontend

React

Vite

TypeScript

---

Backend

Node.js

Express

TypeScript

---

Banco

PostgreSQL

---

ORM

Prisma

---

Container

Docker

Docker Compose

---

Servidor Web

Nginx

---

SSL

Let's Encrypt

---

# Variáveis de Ambiente

Backend

```
DATABASE_URL=

JWT_SECRET=

JWT_EXPIRES_IN=

PORT=
```

Frontend

```
VITE_API_URL=
```

Nunca armazenar senhas diretamente no código.

---

# Estrutura de Produção

```
/opt/sgcl

backend/

frontend/

docker-compose.yml

.env

backups/

logs/
```

---

# Docker

Containers

Frontend

Backend

PostgreSQL

Nginx

---

# Docker Compose

Serviços

frontend

backend

database

nginx

---

# Banco

Desenvolvimento

SQLite

Produção

PostgreSQL

---

# Migrações

Sempre executar:

```
npx prisma migrate deploy
```

Nunca utilizar:

```
migrate dev
```

em produção.

---

# Prisma

Atualizar Client

```
npx prisma generate
```

---

# Build

Frontend

```
npm run build
```

Backend

```
npm run build
```

---

# Inicialização

Backend

```
npm start
```

ou

```
node dist/server.js
```

---

# Processo de Deploy

1.

Atualizar código

↓

2.

Instalar dependências

↓

3.

Executar migrações

↓

4.

Gerar Prisma Client

↓

5.

Build

↓

6.

Reiniciar containers

↓

7.

Validar aplicação

---

# Atualização

Fluxo

Git Pull

↓

npm install

↓

Prisma Generate

↓

Migrate Deploy

↓

Build

↓

Restart

---

# Backup

Backup diário

Banco PostgreSQL

↓

Arquivo SQL

↓

Compactação

↓

Armazenamento externo

---

Retenção

7 dias

30 dias

12 meses

---

# Logs

Backend

Logs de aplicação

---

Nginx

Logs HTTP

---

Banco

Logs de consultas críticas

---

# Monitoramento

CPU

RAM

Espaço em disco

Tempo de resposta

Uso de banco

Disponibilidade

---

# SSL

Todos os acessos deverão utilizar HTTPS.

Certificado

Let's Encrypt

Renovação automática.

---

# Segurança

Nunca expor

.env

Banco

JWT_SECRET

Logs sensíveis

---

# Firewall

Permitir apenas

80

443

22 (SSH)

Bloquear portas internas.

---

# Banco

Acesso apenas pelo backend.

Nunca permitir acesso público ao PostgreSQL.

---

# Estratégia de Atualização

Deploy azul/verde (planejado)

ou

Deploy Rolling

Objetivo

Zero indisponibilidade.

---

# Recuperação

Caso uma atualização falhe.

Restaurar

↓

Container anterior

↓

Banco

↓

Backup

---

# Versionamento

Todas as versões deverão possuir:

Tag Git

Número da versão

Registro no changelog

---

# CI/CD (Futuro)

Pipeline

GitHub

↓

Testes

↓

Build

↓

Deploy

↓

Homologação

↓

Produção

---

# Checklist de Deploy

Antes

- Código revisado
- Testes executados
- Migrações validadas

Durante

- Backup realizado
- Deploy executado
- Logs monitorados

Depois

- Login funcionando
- Dashboard funcionando
- Cadastro funcionando
- Banco atualizado
- API respondendo
- Monitoramento ativo

---

# Recuperação de Desastres

Em caso de falha grave.

1.

Restaurar banco

↓

2.

Restaurar containers

↓

3.

Validar versão

↓

4.

Liberar acesso

---

# Roadmap

Próximas melhorias

- Kubernetes
- Balanceamento de carga
- Redis
- CDN
- Cache
- Observabilidade
- Prometheus
- Grafana
- Sentry
- Deploy automático

---

# Conclusão

O processo de Deploy do SGCL foi projetado para garantir segurança, disponibilidade e rastreabilidade, permitindo que novas versões sejam publicadas com mínimo risco e máxima previsibilidade.