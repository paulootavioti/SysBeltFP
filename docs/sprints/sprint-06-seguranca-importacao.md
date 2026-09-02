# Sprint 06 - Segurança da conta e importação de alunos

## Entregas

- Autenticação TOTP compatível com aplicativos autenticadores.
- Segredos TOTP cifrados com AES-256-GCM e `CHAVE_SEGREDOS`.
- Desafio de segundo fator com validade de cinco minutos no login da equipe e do professor.
- Ativação, confirmação e desativação de 2FA na tela Segurança da conta.
- Importação de até 500 alunos por CSV, com modelo para download.
- Resolução de turma ativa por nome e suporte a datas `DD/MM/AAAA` e ISO.
- Processamento parcial com relatório de erros por linha.

## Operação

Antes de ativar 2FA, configure `CHAVE_SEGREDOS` com 32 bytes em hexadecimal e aplique as migrations. A chave não deve ser trocada sem um processo de recifragem dos segredos existentes.

O CSV usa as colunas `nome`, `data_nascimento`, `apelido`, `email`, `telefone`, `whatsapp`, `cpf`, `faixa`, `turma` e `observacoes`. Nome e data de nascimento são obrigatórios.
