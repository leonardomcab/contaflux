# Casos de Teste Manuais - ContaFlux

Casos gerados a partir de `docs/prompts/prompt-testcase-generator.md`, com base no código atual de
`src/routes/` e `supabase/migrations/`. Todo caso parte de um banco resetado
(`npx supabase db reset`) e cria o próprio estado nas pré-condições. Os IDs são únicos em todo o
projeto; ao adicionar casos, continuar a partir de `CT074`.

## Arquivos

| Arquivo | Módulo | Casos |
|---------|--------|-------|
| [autenticacao.md](autenticacao.md) | Autenticação | CT001 a CT008 |
| [empresas.md](empresas.md) | Empresas | CT009 a CT021 |
| [importacao-ofx.md](importacao-ofx.md) | Importação OFX | CT022 a CT030 |
| [plano-de-contas.md](plano-de-contas.md) | Plano de contas | CT031 a CT039 |
| [regras.md](regras.md) | Regras | CT040 a CT052 |
| [lancamentos.md](lancamentos.md) | Lançamentos | CT053 a CT062 |
| [exportacao.md](exportacao.md) | Exportação | CT063 a CT068 |
| [isolamento-de-dados.md](isolamento-de-dados.md) | Isolamento de dados | CT069 a CT073 |

## Pontos de atenção

- **Isolamento de dados:** as políticas de RLS atuais liberam todos os dados para qualquer usuário
  autenticado (`USING (true)`). CT070, CT071 e CT072 descrevem o comportamento exigido e devem falhar
  até que as políticas sejam restringidas.
- **Exportação XLSX:** citada no `README.md`, mas ainda não existe no código; só há casos de CSV.
- **Massa de dados:** extratos OFX e PDFs do plano de contas são fictícios e estão descritos na seção
  "Dados fictícios" de cada arquivo. Nunca usar arquivos de `examples/privado/`.

## Todos os casos

| ID | Título | Módulo | Prioridade | Tipo |
|----|--------|--------|------------|------|
| [CT001](autenticacao.md#ct001---login-com-credenciais-válidas) | Login com credenciais válidas | Autenticação | Alta | Positivo |
| [CT002](autenticacao.md#ct002---login-com-senha-incorreta) | Login com senha incorreta | Autenticação | Alta | Negativo |
| [CT003](autenticacao.md#ct003---criar-conta-com-dados-válidos) | Criar conta com dados válidos | Autenticação | Alta | Positivo |
| [CT004](autenticacao.md#ct004---criar-conta-com-e-mail-já-cadastrado) | Criar conta com e-mail já cadastrado | Autenticação | Média | Negativo |
| [CT005](autenticacao.md#ct005---criar-conta-com-senha-menor-que-6-caracteres) | Criar conta com senha menor que 6 caracteres | Autenticação | Média | Borda |
| [CT006](autenticacao.md#ct006---acessar-rota-protegida-sem-sessão) | Acessar rota protegida sem sessão | Autenticação | Alta | Permissão |
| [CT007](autenticacao.md#ct007---acessar-a-tela-de-acesso-com-sessão-ativa) | Acessar a tela de acesso com sessão ativa | Autenticação | Baixa | Borda |
| [CT008](autenticacao.md#ct008---sair-do-sistema) | Sair do sistema | Autenticação | Alta | Positivo |
| [CT009](empresas.md#ct009---lista-de-empresas-vazia) | Lista de empresas vazia | Empresas | Baixa | Borda |
| [CT010](empresas.md#ct010---criar-empresa-apenas-com-os-dados-básicos) | Criar empresa apenas com os dados básicos | Empresas | Alta | Positivo |
| [CT011](empresas.md#ct011---avançar-no-assistente-sem-informar-o-nome) | Avançar no assistente sem informar o nome | Empresas | Média | Negativo |
| [CT012](empresas.md#ct012---criar-empresa-com-conta-bancária) | Criar empresa com conta bancária | Empresas | Média | Positivo |
| [CT013](empresas.md#ct013---conta-bancária-sem-apelido-bloqueia-a-conclusão) | Conta bancária sem apelido bloqueia a conclusão | Empresas | Média | Negativo |
| [CT014](empresas.md#ct014---contas-bancárias-duplicadas-bloqueiam-a-conclusão) | Contas bancárias duplicadas bloqueiam a conclusão | Empresas | Média | Negativo |
| [CT015](empresas.md#ct015---criar-empresa-com-plano-de-contas-do-domínio) | Criar empresa com plano de contas do Domínio | Empresas | Média | Positivo |
| [CT016](empresas.md#ct016---aviso-de-cnpj-divergente-entre-empresa-e-pdf) | Aviso de CNPJ divergente entre empresa e PDF | Empresas | Baixa | Borda |
| [CT017](empresas.md#ct017---listagem-de-empresas-em-ordem-alfabética) | Listagem de empresas em ordem alfabética | Empresas | Média | Positivo |
| [CT018](empresas.md#ct018---abrir-empresa-e-navegar-pelo-menu-lateral) | Abrir empresa e navegar pelo menu lateral | Empresas | Alta | Positivo |
| [CT019](empresas.md#ct019---remover-empresa-sem-dados-vinculados) | Remover empresa sem dados vinculados | Empresas | Alta | Positivo |
| [CT020](empresas.md#ct020---remover-empresa-exibe-a-contagem-dos-dados-apagados) | Remover empresa exibe a contagem dos dados apagados | Empresas | Alta | Positivo |
| [CT021](empresas.md#ct021---cancelar-a-remoção-de-uma-empresa) | Cancelar a remoção de uma empresa | Empresas | Média | Negativo |
| [CT022](importacao-ofx.md#ct022---importar-extrato-ofx-válido) | Importar extrato OFX válido | Importação OFX | Alta | Positivo |
| [CT023](importacao-ofx.md#ct023---créditos-e-débitos-importados-com-sinal-e-totais-corretos) | Créditos e débitos importados com sinal e totais corretos | Importação OFX | Alta | Positivo |
| [CT024](importacao-ofx.md#ct024---enviar-arquivo-que-não-é-ofx) | Enviar arquivo que não é OFX | Importação OFX | Alta | Negativo |
| [CT025](importacao-ofx.md#ct025---enviar-ofx-sem-lançamentos) | Enviar OFX sem lançamentos | Importação OFX | Média | Borda |
| [CT026](importacao-ofx.md#ct026---reimportar-o-mesmo-extrato-ignora-lançamentos-repetidos) | Reimportar o mesmo extrato ignora lançamentos repetidos | Importação OFX | Alta | Borda |
| [CT027](importacao-ofx.md#ct027---histórico-em-importações-recentes) | Histórico em "Importações recentes" | Importação OFX | Média | Positivo |
| [CT028](importacao-ofx.md#ct028---cancelar-a-prévia-da-importação) | Cancelar a prévia da importação | Importação OFX | Baixa | Negativo |
| [CT029](importacao-ofx.md#ct029---apelido-da-conta-editado-na-prévia) | Apelido da conta editado na prévia | Importação OFX | Média | Positivo |
| [CT030](importacao-ofx.md#ct030---primeira-importação-usa-a-conta-cadastrada-no-assistente) | Primeira importação usa a conta cadastrada no assistente | Importação OFX | Média | Positivo |
| [CT031](plano-de-contas.md#ct031---plano-de-contas-vazio) | Plano de contas vazio | Plano de contas | Baixa | Borda |
| [CT032](plano-de-contas.md#ct032---criar-conta-no-plano-de-contas) | Criar conta no plano de contas | Plano de contas | Alta | Positivo |
| [CT033](plano-de-contas.md#ct033---adicionar-conta-sem-nome) | Adicionar conta sem nome | Plano de contas | Média | Negativo |
| [CT034](plano-de-contas.md#ct034---importar-plano-de-contas-do-domínio) | Importar plano de contas do Domínio | Plano de contas | Alta | Positivo |
| [CT035](plano-de-contas.md#ct035---reimportar-plano-de-contas-atualiza-sem-duplicar) | Reimportar plano de contas atualiza sem duplicar | Plano de contas | Média | Borda |
| [CT036](plano-de-contas.md#ct036---importar-pdf-que-não-é-plano-de-contas) | Importar PDF que não é plano de contas | Plano de contas | Média | Negativo |
| [CT037](plano-de-contas.md#ct037---remover-conta-sem-vínculos) | Remover conta sem vínculos | Plano de contas | Média | Positivo |
| [CT038](plano-de-contas.md#ct038---remover-conta-com-regras-e-lançamentos-vinculados) | Remover conta com regras e lançamentos vinculados | Plano de contas | Alta | Positivo |
| [CT039](plano-de-contas.md#ct039---contas-sintéticas-não-aparecem-para-classificação) | Contas sintéticas não aparecem para classificação | Plano de contas | Média | Borda |
| [CT040](regras.md#ct040---criar-regra-do-tipo-contém) | Criar regra do tipo "Contém" | Regras | Alta | Positivo |
| [CT041](regras.md#ct041---criar-regra-sem-escolher-a-categoria) | Criar regra sem escolher a categoria | Regras | Média | Negativo |
| [CT042](regras.md#ct042---criar-regra-sem-texto-e-sem-filtro-de-valor) | Criar regra sem texto e sem filtro de valor | Regras | Média | Negativo |
| [CT043](regras.md#ct043---valor-mínimo-maior-que-o-máximo) | Valor mínimo maior que o máximo | Regras | Média | Negativo |
| [CT044](regras.md#ct044---valor-mínimo-negativo) | Valor mínimo negativo | Regras | Baixa | Negativo |
| [CT045](regras.md#ct045---expressão-regular-inválida) | Expressão regular inválida | Regras | Baixa | Negativo |
| [CT046](regras.md#ct046---remover-regra) | Remover regra | Regras | Alta | Positivo |
| [CT047](regras.md#ct047---aplicar-regras-nos-lançamentos-pendentes) | Aplicar regras nos lançamentos pendentes | Regras | Alta | Positivo |
| [CT048](regras.md#ct048---reprocessar-sem-nenhuma-regra-ativa) | Reprocessar sem nenhuma regra ativa | Regras | Média | Negativo |
| [CT049](regras.md#ct049---reprocessar-tudo-mantém-os-ajustes-manuais) | Reprocessar tudo mantém os ajustes manuais | Regras | Alta | Borda |
| [CT050](regras.md#ct050---regra-de-menor-prioridade-vence) | Regra de menor prioridade vence | Regras | Alta | Borda |
| [CT051](regras.md#ct051---regra-inativa-não-é-aplicada) | Regra inativa não é aplicada | Regras | Média | Borda |
| [CT052](regras.md#ct052---regra-só-por-valor-para-saídas) | Regra só por valor para saídas | Regras | Média | Borda |
| [CT053](lancamentos.md#ct053---empresa-sem-lançamentos) | Empresa sem lançamentos | Lançamentos | Baixa | Borda |
| [CT054](lancamentos.md#ct054---classificação-automática-na-importação) | Classificação automática na importação | Lançamentos | Alta | Positivo |
| [CT055](lancamentos.md#ct055---classificar-um-lançamento-manualmente) | Classificar um lançamento manualmente | Lançamentos | Alta | Positivo |
| [CT056](lancamentos.md#ct056---classificar-vários-lançamentos-em-lote) | Classificar vários lançamentos em lote | Lançamentos | Alta | Positivo |
| [CT057](lancamentos.md#ct057---limpar-categoria-em-lote) | Limpar categoria em lote | Lançamentos | Média | Positivo |
| [CT058](lancamentos.md#ct058---filtrar-por-situação) | Filtrar por situação | Lançamentos | Média | Positivo |
| [CT059](lancamentos.md#ct059---buscar-pela-descrição) | Buscar pela descrição | Lançamentos | Média | Positivo |
| [CT060](lancamentos.md#ct060---filtrar-por-conta-bancária) | Filtrar por conta bancária | Lançamentos | Média | Positivo |
| [CT061](lancamentos.md#ct061---filtrar-por-período) | Filtrar por período | Lançamentos | Alta | Positivo |
| [CT062](lancamentos.md#ct062---voltar-um-lançamento-para-sem-categoria) | Voltar um lançamento para "Sem categoria" | Lançamentos | Baixa | Borda |
| [CT063](exportacao.md#ct063---exportar-csv-somente-com-lançamentos-classificados) | Exportar CSV somente com lançamentos classificados | Exportação | Alta | Positivo |
| [CT064](exportacao.md#ct064---exportar-csv-com-todos-os-lançamentos) | Exportar CSV com todos os lançamentos | Exportação | Média | Positivo |
| [CT065](exportacao.md#ct065---exportar-csv-somente-com-lançamentos-pendentes) | Exportar CSV somente com lançamentos pendentes | Exportação | Média | Positivo |
| [CT066](exportacao.md#ct066---exportar-com-filtro-que-não-retorna-lançamentos) | Exportar com filtro que não retorna lançamentos | Exportação | Média | Negativo |
| [CT067](exportacao.md#ct067---exportar-em-empresa-sem-lançamentos) | Exportar em empresa sem lançamentos | Exportação | Baixa | Borda |
| [CT068](exportacao.md#ct068---nome-do-arquivo-conforme-o-período) | Nome do arquivo conforme o período | Exportação | Baixa | Borda |
| [CT069](isolamento-de-dados.md#ct069---url-direta-de-empresa-sem-sessão) | URL direta de empresa sem sessão | Isolamento de dados | Alta | Permissão |
| [CT070](isolamento-de-dados.md#ct070---usuário-não-vê-empresas-de-outro-usuário-na-lista) | Usuário não vê empresas de outro usuário na lista | Isolamento de dados | Alta | Permissão |
| [CT071](isolamento-de-dados.md#ct071---usuário-não-acessa-empresa-de-outro-usuário-pela-url) | Usuário não acessa empresa de outro usuário pela URL | Isolamento de dados | Alta | Permissão |
| [CT072](isolamento-de-dados.md#ct072---usuário-não-altera-dados-da-empresa-de-outro-usuário) | Usuário não altera dados da empresa de outro usuário | Isolamento de dados | Alta | Permissão |
| [CT073](isolamento-de-dados.md#ct073---voltar-no-navegador-após-sair-não-exibe-dados) | Voltar no navegador após sair não exibe dados | Isolamento de dados | Média | Permissão |
