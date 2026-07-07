# Segurança

Versão: 1.0

Última atualização: Julho/2026

---

# Objetivo

Este documento define todas as diretrizes de segurança adotadas pelo SGCL Kids.

Seu objetivo é proteger:

- dados dos alunos;
- dados dos responsáveis;
- informações financeiras;
- registros pedagógicos;
- usuários do sistema;
- infraestrutura da aplicação.

---

# Princípios

Toda funcionalidade do SGCL deve obedecer aos seguintes princípios:

- Confidencialidade
- Integridade
- Disponibilidade
- Rastreabilidade
- Menor privilégio

---

# Arquitetura de Segurança

Usuário

↓

Login

↓

JWT

↓

Middleware

↓

Controller

↓

Service

↓

Prisma

↓

Banco

---

# Autenticação

O sistema utiliza:

JWT (JSON Web Token)

---

Fluxo

Login

↓

Validação

↓

Geração do Token

↓

Frontend

↓

Authorization Bearer

↓

API

---

# Senhas

As senhas nunca são armazenadas em texto.

Algoritmo

bcrypt

Biblioteca

bcryptjs

---

Exemplo

Senha

↓

Hash

↓

Banco

---

# Política de Senhas

Recomendada

Mínimo

8 caracteres

Recomenda-se conter:

- letras maiúsculas
- letras minúsculas
- números
- caracteres especiais

---

# JWT

Informações contidas

id do usuário

perfil

expiração

---

Nunca armazenar

senha

dados pessoais

informações financeiras

---

# Expiração

Padrão

7 dias

Configurável via:

JWT_EXPIRES_IN

---

# Variáveis Sensíveis

Nunca devem ser enviadas ao Git.

Exemplos

DATABASE_URL

JWT_SECRET

SMTP_PASSWORD

AWS_SECRET

PIX_TOKEN

---

Todas ficam em:

.env

---

# Controle de Acesso

Perfis

ADMIN

↓

Acesso total

---

PROFESSOR

↓

Módulos pedagógicos

↓

Consultas

↓

Aulas

↓

Graduações

---

RECEPCAO

↓

Cadastros

↓

Financeiro

↓

Responsáveis

---

# Middleware

Toda rota protegida utiliza:

ensureAuthenticated

↓

ensureRole

---

# Princípio do Menor Privilégio

Todo usuário recebe apenas as permissões necessárias para executar sua função.

Nunca conceder permissões administrativas desnecessariamente.

---

# Tratamento de Erros

Nunca retornar:

Stack Trace

SQL

Prisma Errors

JWT Secret

Caminhos internos

---

Sempre retornar mensagens amigáveis.

Exemplo

```
{
  "message":"Usuário não encontrado."
}
```

---

# SQL Injection

O Prisma ORM protege automaticamente contra SQL Injection.

Nunca concatenar SQL manualmente.

Correto

Prisma

Errado

String SQL

---

# XSS

Todo conteúdo exibido na interface deve ser tratado pelo React.

Nunca utilizar:

dangerouslySetInnerHTML

sem sanitização.

---

# CSRF

Como a API utiliza JWT no Header Authorization, o risco de CSRF é reduzido.

Ainda assim:

- validar origem das requisições;
- utilizar HTTPS.

---

# CORS

Permitir apenas domínios autorizados.

Exemplo

```
http://localhost:5173
```

Produção

```
https://sgcl.com.br
```

---

# Dados Sensíveis

São considerados sensíveis:

CPF

RG

Telefone

Endereço

Dados médicos

Mensalidades

Observações

Esses dados devem ser acessados apenas por usuários autorizados.

---

# LGPD

O sistema deve atender aos princípios da Lei Geral de Proteção de Dados.

Diretrizes

- minimização de dados;
- finalidade definida;
- segurança;
- rastreabilidade;
- transparência.

---

# Logs

Nunca registrar:

Senhas

JWT

Hash

Dados médicos

CPF completo

---

Registrar apenas:

Data

Usuário

Operação

Módulo

Resultado

---

# Auditoria

Estrutura prevista

Tabela

Auditoria

Campos

Usuário

Data

Ação

Entidade

ID

Valores anteriores

Valores novos

---

# Upload de Arquivos

Planejamento futuro.

Permitir apenas:

jpg

png

webp

pdf

Limitar tamanho dos arquivos.

---

# Backup

Periodicidade

Diária

Armazenamento

Local

Nuvem

Retenção

7 dias

30 dias

12 meses

---

# Monitoramento

Monitorar

Tentativas de login

Erros

Consumo de recursos

Tempo de resposta

Disponibilidade

---

# Recuperação

Em caso de incidente

1.

Isolar problema

↓

2.

Restaurar backup

↓

3.

Validar banco

↓

4.

Liberar sistema

---

# Boas Práticas

Nunca utilizar any para dados sensíveis.

Nunca desabilitar autenticação em produção.

Nunca armazenar segredos no código.

Nunca compartilhar banco de produção.

Sempre revisar permissões.

Sempre validar entradas do usuário.

---

# Roadmap

Próximas melhorias

Autenticação em dois fatores (2FA)

Recuperação de senha por e-mail

Bloqueio após tentativas de login

Sessões simultâneas

Auditoria completa

Logs estruturados

Criptografia de arquivos

Integração com serviços de monitoramento

---

# Conclusão

A segurança do SGCL deve evoluir continuamente.

Toda nova funcionalidade deverá ser analisada sob a perspectiva de proteção dos dados, controle de acesso e conformidade com as boas práticas de desenvolvimento seguro.