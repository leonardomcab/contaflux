# Casos de Teste - Empresas

Rotas cobertas: `/empresas` (lista, assistente "Nova empresa" e exclusão) e a navegação para
`/empresas/$companyId`.

## Dados fictícios usados neste arquivo

### Usuário padrão

Criado pela aba "Criar conta" em `/auth` logo após o reset do banco:

- Nome completo: `Analista Teste`
- E-mail: `analista.teste@contaflux.local`
- Senha: `Senha@Teste123`

### PDF fictício `plano-dominio-ficticio.pdf`

PDF de texto (não imagem), com uma conta por linha, imitando o relatório "Plano de Contas" do
Domínio. Pode ser gerado a partir de um editor de texto com "Salvar como PDF":

```
Empresa: 999 - COMERCIO FICTICIO LTDA
CNPJ: 11.222.333/0001-81
Classificação Código T Descrição Grau
1 1 S ATIVO 1
1.1 2 S ATIVO CIRCULANTE 2
1.1.1 3 S BANCOS CONTA MOVIMENTO 3
1.1.1.01 4 A BANCO ALFA AG 1234 C/C 12345-6 4
3 5 S RECEITAS 1
3.1 6 A RECEITA DE SERVICOS 2
4 7 S DESPESAS 1
4.1 8 A TARIFAS BANCARIAS 2
4.2 9 A FORNECEDORES 2
Total de Contas Contábeis: 9
```

### Extrato fictício `extrato-alfa-2026-03.ofx`

```
OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>0341
<ACCTID>12345-6
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260331
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260305
<TRNAMT>1500.00
<FITID>F001
<NAME>PIX RECEBIDO CLIENTE BETA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260310
<TRNAMT>-45.90
<FITID>F002
<NAME>TARIFA PACOTE SERVICOS
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
```

---

### **CT009 - Lista de empresas vazia**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar a mensagem exibida quando ainda não há empresas cadastradas.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário padrão criado e logado
- Nenhuma empresa cadastrada

#### **Dados de Teste**

- Nenhum dado adicional

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` | O título "Empresas" e o texto "Escolha um cliente para importar extratos e classificar lançamentos." são exibidos |
| 2 | Verificar a área da lista | É exibida a mensagem "Nenhuma empresa cadastrada. Comece criando o primeiro cliente." |
| 3 | Verificar o botão de cadastro | O botão "Nova empresa" está visível e habilitado |

#### **Resultados Esperados**

- Nenhum card de empresa é exibido

#### **Critérios de Aceitação**

- O menu lateral exibe apenas o grupo "Geral" com o item "Empresas"

---

### **CT010 - Criar empresa apenas com os dados básicos**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o cadastro de uma empresa pelo assistente pulando as etapas opcionais.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado

#### **Dados de Teste**

- Nome: `Padaria Fictícia Ltda`
- CNPJ: `11111111000111` (digitado só com números)
- Observações: `Cliente de teste`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` e clicar em "Nova empresa" | Abre o diálogo "Cadastrar empresa cliente" com o texto "Informe os dados da empresa e, se quiser, importe o plano de contas do Domínio e as contas bancárias. Você revisa tudo antes de salvar." e as etapas "Dados da empresa", "Plano de contas", "Contas bancárias" e "Revisão", com a primeira destacada |
| 2 | Preencher "Nome", "CNPJ" e "Observações" com os dados de teste | O "CNPJ" é formatado durante a digitação e fica `11.111.111/0001-11`; o botão "Próximo" fica habilitado |
| 3 | Clicar em "Próximo" | A etapa "Plano de contas" é exibida com a área "Arraste o PDF do plano de contas do Domínio aqui ou clique para escolher" e o botão "Pular" |
| 4 | Clicar em "Pular" | A etapa "Contas bancárias" é exibida com o texto "Nenhuma conta bancária." |
| 5 | Clicar em "Próximo" | A etapa "Revisão" exibe "Confira os dados antes de concluir. Nada foi gravado ainda." e os blocos "Dados da empresa" (Nome `Padaria Fictícia Ltda`, CNPJ `11.111.111/0001-11`, Observações `Cliente de teste`), "Plano de contas" ("Nenhum plano de contas importado.") e "Contas bancárias" ("Nenhuma conta bancária."), cada um com o botão "Editar" |
| 6 | Clicar em "Concluir" | O botão mostra "Salvando..."; o toast "Empresa cadastrada" é exibido, o diálogo fecha e o sistema redireciona para `/empresas/<id da empresa>` |
| 7 | Verificar o cabeçalho da página | O título "Padaria Fictícia Ltda" e o CNPJ `11.111.111/0001-11` são exibidos |

#### **Resultados Esperados**

- A empresa é criada sem contas bancárias e sem plano de contas
- Nada é gravado antes do clique em "Concluir" na etapa "Revisão"

#### **Critérios de Aceitação**

- Ao voltar para `/empresas`, o card "Padaria Fictícia Ltda" aparece com o CNPJ e a observação "Cliente de teste"
- Em "Plano de contas" da empresa é exibido "Nenhuma conta cadastrada ainda."

---

### **CT011 - Validações da etapa Dados da empresa**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que o nome da empresa é obrigatório e que o CNPJ, quando informado, respeita a máscara e
precisa estar completo para avançar no assistente.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado

#### **Dados de Teste**

- Nome: vazio, depois `   ` (somente espaços) e depois `Empresa Fictícia Ltda`
- CNPJ: `2222222200012299` (16 números, dois a mais que um CNPJ)

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` e clicar em "Nova empresa" | O diálogo "Cadastrar empresa cliente" é exibido na etapa "Dados da empresa" |
| 2 | Digitar apenas o "CNPJ" com os dados de teste | O campo exibe `22.222.222/0001-22` e ignora os números excedentes; o botão "Próximo" continua desabilitado |
| 3 | Preencher "Nome" com três espaços | O botão "Próximo" continua desabilitado |
| 4 | Preencher "Nome" com `Empresa Fictícia Ltda` | O botão "Próximo" fica habilitado |
| 5 | Apagar o final do "CNPJ" até ficar `22.222.222/000` e clicar em "Observações" | Abaixo do campo aparece "O CNPJ precisa ter 14 caracteres. Deixe em branco se não souber." e o botão "Próximo" fica desabilitado |
| 6 | Apagar todo o "CNPJ" | A mensagem some e o botão "Próximo" volta a ficar habilitado |
| 7 | Fechar o diálogo | Nenhum toast é exibido e nenhuma empresa nova aparece na lista |

#### **Resultados Esperados**

- Não é possível sair da primeira etapa sem um nome preenchido
- O CNPJ é opcional, mas não é aceito pela metade e nunca passa de 14 caracteres

#### **Critérios de Aceitação**

- A lista continua exibindo "Nenhuma empresa cadastrada. Comece criando o primeiro cliente."

---

### **CT012 - Criar empresa com conta bancária**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar o cadastro de uma conta bancária na última etapa do assistente.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado

#### **Dados de Teste**

- Nome: `Oficina Fictícia ME`
- Conta bancária: Apelido `Banco Alfa`, Código do banco `0341`, Número da conta `12345-6`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Nova empresa", preencher "Nome" e clicar em "Próximo" | A etapa "Plano de contas" é exibida |
| 2 | Clicar em "Pular" | A etapa "Contas bancárias" exibe "Cadastre as contas bancárias da empresa. Esta etapa é opcional." |
| 3 | Clicar em "Adicionar conta" | Surge uma linha com os campos "Apelido", "Código do banco" e "Número da conta" |
| 4 | Preencher a linha com os dados de teste | Os campos ficam preenchidos, sem mensagem de erro |
| 5 | Clicar em "Próximo" | A etapa "Revisão" lista no bloco "Contas bancárias" a conta "Banco Alfa" com "Banco 0341 · Conta 12345-6" |
| 6 | Clicar em "Editar" no bloco "Contas bancárias" | A etapa "Contas bancárias" volta a ser exibida com a linha preenchida |
| 7 | Clicar em "Próximo" e depois em "Concluir" | O toast "Empresa cadastrada" é exibido e o sistema redireciona para a página da empresa |
| 8 | Na página da empresa, abrir o seletor "Conta" | A opção "Banco Alfa" é listada além de "Todas" |

#### **Resultados Esperados**

- A empresa é criada com uma conta bancária "Banco Alfa"
- Voltar da revisão pelo botão "Editar" mantém os dados já preenchidos

#### **Critérios de Aceitação**

- Na exclusão da empresa (botão "Remover Oficina Fictícia ME"), o diálogo exibe "Contas bancárias" com contagem 1

---

### **CT013 - Conta bancária sem apelido bloqueia a conclusão**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que toda conta bancária adicionada no assistente precisa de apelido.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado

#### **Dados de Teste**

- Nome: `Mercado Fictício Ltda`
- Conta bancária: Apelido vazio, Código do banco `0341`, Número da conta `12345-6`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Nova empresa", preencher "Nome", clicar em "Próximo" e depois em "Pular" | A etapa "Contas bancárias" é exibida |
| 2 | Clicar em "Adicionar conta" e preencher só "Código do banco" e "Número da conta" | Os campos ficam preenchidos |
| 3 | Clicar em "Próximo" | Abaixo da linha aparece "Informe um apelido para a conta."; o assistente continua na etapa "Contas bancárias" e nenhum toast é exibido |
| 4 | Preencher "Apelido" com `Banco Alfa` e clicar em "Próximo" | A etapa "Revisão" é exibida com a conta "Banco Alfa" |
| 5 | Clicar em "Concluir" | O toast "Empresa cadastrada" é exibido e o sistema abre a página da empresa |

#### **Resultados Esperados**

- A empresa só é gravada depois que a conta recebe apelido

#### **Critérios de Aceitação**

- Na lista de empresas existe exatamente um card "Mercado Fictício Ltda"

---

### **CT014 - Contas bancárias duplicadas bloqueiam a conclusão**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que o assistente não aceita duas contas com o mesmo banco e número.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado

#### **Dados de Teste**

- Nome: `Farmácia Fictícia Ltda`
- Conta 1: Apelido `Conta principal`, Código do banco `0341`, Número da conta `12345-6`
- Conta 2: Apelido `Conta repetida`, Código do banco `0341`, Número da conta `12345-6`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Nova empresa", preencher "Nome", clicar em "Próximo" e depois em "Pular" | A etapa "Contas bancárias" é exibida |
| 2 | Clicar duas vezes em "Adicionar conta" e preencher as duas linhas com os dados de teste | Duas linhas preenchidas são exibidas |
| 3 | Clicar em "Próximo" | Abaixo da segunda linha aparece `Mesmo banco e número de "Conta principal".`; o assistente continua na etapa "Contas bancárias" |
| 4 | Clicar em "Remover Conta repetida" e depois em "Próximo" | A etapa "Revisão" lista apenas a conta "Conta principal" |
| 5 | Clicar em "Concluir" | O toast "Empresa cadastrada" é exibido |

#### **Resultados Esperados**

- A empresa é gravada com uma única conta bancária

#### **Critérios de Aceitação**

- O seletor "Conta" na página da empresa lista apenas "Todas" e "Conta principal"

---

### **CT015 - Criar empresa com plano de contas do Domínio**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar que o PDF do plano de contas preenche nome e CNPJ vazios, importa as contas e sugere as
contas bancárias de "Bancos conta movimento".

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Arquivo `plano-dominio-ficticio.pdf` gerado conforme a seção de dados fictícios

#### **Dados de Teste**

- Arquivo: `plano-dominio-ficticio.pdf`
- Nome: `Comércio Fictício` (digitado na primeira etapa); CNPJ deixado em branco
- Código do banco da conta sugerida: `0341`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Nova empresa", preencher apenas "Nome" e clicar em "Próximo" | A etapa "Plano de contas" é exibida |
| 2 | Clicar na área de upload e escolher `plano-dominio-ficticio.pdf` | A prévia mostra "plano-dominio-ficticio.pdf · 9 contas lidas · 9 serão importadas" e a tabela com as colunas "Cód.", "Classificação", "Descrição", "T" e "Tipo"; o botão do rodapé passa a ser "Próximo" |
| 3 | Clicar em "Voltar" | O "Nome" continua `Comércio Fictício` e o "CNPJ" foi preenchido com `11.222.333/0001-81` |
| 4 | Clicar em "Próximo" duas vezes | A etapa "Contas bancárias" exibe o texto 'Estas contas foram encontradas em "Bancos conta movimento" do plano de contas. Revise antes de concluir.' e uma linha com Apelido `BANCO ALFA - AG 1234` e Número da conta `12345-6` |
| 5 | Preencher "Código do banco" com `0341` e clicar em "Próximo" | A etapa "Revisão" exibe o CNPJ `11.222.333/0001-81`, o bloco "Plano de contas" com "plano-dominio-ficticio.pdf · 9 contas serão importadas" e a conta "BANCO ALFA - AG 1234" com "Banco 0341 · Conta 12345-6" |
| 6 | Clicar em "Concluir" | O toast "Empresa cadastrada" é exibido e o sistema abre a página "Comércio Fictício" |
| 7 | Clicar em "Plano de contas" no menu lateral | A tabela lista as 9 contas; ATIVO, ATIVO CIRCULANTE, BANCOS CONTA MOVIMENTO, RECEITAS e DESPESAS têm o selo "Sintética" |

#### **Resultados Esperados**

- Empresa, plano de contas e conta bancária são gravados juntos

#### **Critérios de Aceitação**

- O nome digitado não é substituído pelo nome do PDF
- A conta "RECEITA DE SERVICOS" aparece com o tipo `receita`, "TARIFAS BANCARIAS" com `despesa` e "BANCO ALFA AG 1234 C/C 12345-6" com `transferencia`

---

### **CT016 - Aviso de CNPJ divergente entre empresa e PDF**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar o alerta exibido quando o CNPJ do PDF é diferente do CNPJ digitado.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Arquivo `plano-dominio-ficticio.pdf` gerado conforme a seção de dados fictícios

#### **Dados de Teste**

- Nome: `Empresa Divergente Fictícia`
- CNPJ: `99.999.999/0001-99`
- Arquivo: `plano-dominio-ficticio.pdf` (CNPJ `11.222.333/0001-81`)

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Nova empresa", preencher "Nome" e "CNPJ" e clicar em "Próximo" | A etapa "Plano de contas" é exibida |
| 2 | Enviar `plano-dominio-ficticio.pdf` | É exibido o alerta "O PDF é do CNPJ 11.222.333/0001-81 (COMERCIO FICTICIO LTDA), diferente do CNPJ informado na etapa anterior." |
| 3 | Clicar em "Voltar" | O "CNPJ" continua `99.999.999/0001-99` |

#### **Resultados Esperados**

- O alerta é apenas informativo; o CNPJ digitado é mantido

#### **Critérios de Aceitação**

- O assistente continua permitindo avançar com "Próximo"

---

### **CT017 - Listagem de empresas em ordem alfabética**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar a ordenação e as informações exibidas em cada card da lista.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresas cadastradas pelo assistente, nesta ordem: `Zeta Fictícia Ltda` (CNPJ `33.333.333/0001-33`,
  Observações `Cliente antigo`) e `Alfa Fictícia Ltda` (sem CNPJ e sem observações)

#### **Dados de Teste**

- As duas empresas das pré-condições

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` | Dois cards são exibidos, "Alfa Fictícia Ltda" antes de "Zeta Fictícia Ltda" |
| 2 | Verificar o card "Alfa Fictícia Ltda" | Exibe "sem CNPJ", a observação "—" e o botão "Abrir" |
| 3 | Verificar o card "Zeta Fictícia Ltda" | Exibe `33.333.333/0001-33`, a observação "Cliente antigo" e o botão "Abrir" |

#### **Resultados Esperados**

- A lista é ordenada pelo nome, independentemente da ordem de cadastro

#### **Critérios de Aceitação**

- Cada card possui o botão "Remover <nome da empresa>"

---

### **CT018 - Abrir empresa e navegar pelo menu lateral**

- **Módulo:** Empresas
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que, ao abrir uma empresa, o menu lateral passa a exibir as páginas dela.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa `Padaria Fictícia Ltda` cadastrada pelo assistente

#### **Dados de Teste**

- Empresa: `Padaria Fictícia Ltda`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` e clicar em "Abrir" no card da empresa | A URL passa a `/empresas/<id>` e o título "Padaria Fictícia Ltda" é exibido |
| 2 | Verificar o menu lateral | Surge o grupo "Padaria Fictícia Ltda" com "Lançamentos", "Importar OFX", "Plano de contas", "Regras" e "Exportar"; "Lançamentos" está ativo |
| 3 | Clicar em "Importar OFX" | A URL termina em `/importar` e o card "Importar extrato OFX" é exibido |
| 4 | Clicar em "Plano de contas" | A URL termina em `/plano-de-contas` e o botão "Importar do Domínio" é exibido |
| 5 | Clicar em "Regras" | A URL termina em `/regras` e o card "Nova regra" é exibido |
| 6 | Clicar em "Exportar" | A URL termina em `/exportar` e o card "Exportar lançamentos" é exibido |
| 7 | Clicar em "Empresas" no grupo "Geral" | A lista de empresas é exibida e o grupo da empresa some do menu |
| 8 | Clicar no nome "Padaria Fictícia Ltda" no card | A página de lançamentos da empresa é exibida |

#### **Resultados Esperados**

- Todas as páginas da empresa são acessíveis pelo menu lateral, mantendo o título da empresa

#### **Critérios de Aceitação**

- O título "Padaria Fictícia Ltda" aparece no topo de todas as páginas da empresa

---

### **CT019 - Remover empresa sem dados vinculados**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar a exclusão de uma empresa recém-criada, sem registros dependentes.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa `Padaria Fictícia Ltda` cadastrada pelo assistente pulando as etapas opcionais

#### **Dados de Teste**

- Empresa: `Padaria Fictícia Ltda`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` e clicar em "Remover Padaria Fictícia Ltda" | Abre o diálogo "Excluir Padaria Fictícia Ltda?" com o texto "Todos os dados desta empresa serão apagados definitivamente. Esta ação não pode ser desfeita." |
| 2 | Aguardar o cálculo do impacto | O quadro exibe "Nenhum outro registro será afetado." |
| 3 | Clicar em "Excluir" | O toast "Empresa removida" é exibido e o diálogo fecha |
| 4 | Verificar a lista | É exibida a mensagem "Nenhuma empresa cadastrada. Comece criando o primeiro cliente." |

#### **Resultados Esperados**

- A empresa é apagada

#### **Critérios de Aceitação**

- Recarregar a página não faz a empresa reaparecer

---

### **CT020 - Remover empresa exibe a contagem dos dados apagados**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que o diálogo de exclusão mostra quantos registros de cada tipo serão apagados em cascata.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa `Padaria Fictícia Ltda` cadastrada pelo assistente pulando as etapas opcionais
- Em "Plano de contas": conta `4.1` "Tarifas bancárias", tipo Despesa, criada com "Adicionar"
- Em "Regras": regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias", criada com "Criar regra"
- Em "Importar OFX": `extrato-alfa-2026-03.ofx` importado com "Confirmar importação"

#### **Dados de Teste**

- Empresa: `Padaria Fictícia Ltda`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` e clicar em "Remover Padaria Fictícia Ltda" | Abre o diálogo "Excluir Padaria Fictícia Ltda?" e, enquanto carrega, aparece "Calculando o impacto..." |
| 2 | Conferir o quadro de impacto | São listados "Lançamentos" 2, "Importações" 1, "Contas bancárias" 1, "Contas do plano de contas" 1 e "Regras" 1 |
| 3 | Clicar em "Excluir" | O botão mostra "Excluindo..."; o toast "Empresa removida" é exibido |
| 4 | Verificar a lista | A empresa não é mais exibida |

#### **Resultados Esperados**

- A empresa e todos os seus dados são apagados

#### **Critérios de Aceitação**

- As contagens do diálogo correspondem aos dados criados nas pré-condições

---

### **CT021 - Cancelar a remoção de uma empresa**

- **Módulo:** Empresas
- **Rota:** `/empresas`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que cancelar o diálogo de exclusão mantém a empresa.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa `Padaria Fictícia Ltda` cadastrada pelo assistente

#### **Dados de Teste**

- Empresa: `Padaria Fictícia Ltda`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` e clicar em "Remover Padaria Fictícia Ltda" | O diálogo "Excluir Padaria Fictícia Ltda?" é exibido |
| 2 | Clicar em "Cancelar" | O diálogo fecha e nenhum toast é exibido |
| 3 | Recarregar a página | O card "Padaria Fictícia Ltda" continua na lista |

#### **Resultados Esperados**

- Nenhum dado é apagado

#### **Critérios de Aceitação**

- O toast "Empresa removida" não aparece
