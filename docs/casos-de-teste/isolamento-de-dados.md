# Casos de Teste - Isolamento de Dados (RLS)

Rotas cobertas: `/empresas` e `/empresas/$companyId/*` acessadas por usuários diferentes.

> **Atenção - divergência conhecida:** as políticas de RLS atuais em `supabase/migrations/`
> (`companies_all`, `bank_accounts_all`, `categories_all`, `rules_all`, `imports_all`,
> `transactions_all`) usam `USING (true) WITH CHECK (true)` para qualquer usuário autenticado. Ou
> seja, hoje todos os usuários logados enxergam e alteram os dados de todas as empresas. Os casos
> CT070, CT071 e CT072 descrevem o comportamento exigido (um usuário não acessa empresas de outro) e
> **devem falhar** até que as políticas sejam restringidas. Os casos CT069 e CT073 já devem passar,
> porque dependem só da proteção de rotas sem sessão.

## Dados fictícios usados neste arquivo

### Usuários

Criados pela aba "Criar conta" em `/auth` logo após o reset do banco:

- Usuário A: Nome completo `Analista A`, E-mail `analista.a@contaflux.local`, Senha `Senha@TesteA1`
- Usuário B: Nome completo `Analista B`, E-mail `analista.b@contaflux.local`, Senha `Senha@TesteB2`

### Dados do usuário A

Logado como A:

1. Empresa `Empresa do Analista A Ltda` (CNPJ `44.444.444/0001-44`) cadastrada pelo botão
   "Nova empresa", pulando as etapas opcionais
2. Em "Plano de contas", conta Código `4.1`, Nome da conta `Tarifas bancárias`, Tipo Despesa
3. Em "Importar OFX", `extrato-alfa-2026-03.ofx` importado
4. Anotar a URL da empresa (`/empresas/<id da empresa de A>`)

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

### **CT069 - URL direta de empresa sem sessão**

- **Módulo:** Isolamento de dados
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Permissão

#### **Objetivo**

Validar que ninguém sem login acessa as páginas de uma empresa existente, mesmo tendo a URL.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário A criado e dados do usuário A cadastrados
- Usuário A deslogado (clicar em "Sair")

#### **Dados de Teste**

- URLs: `/empresas/<id da empresa de A>`, `/empresas/<id da empresa de A>/exportar`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em uma janela anônima, acessar `/empresas/<id da empresa de A>` | O sistema redireciona para `/auth` |
| 2 | Acessar `/empresas/<id da empresa de A>/exportar` | O sistema redireciona para `/auth` |

#### **Resultados Esperados**

- Nenhum dado da empresa (nome, lançamentos, resumo) é exibido

#### **Critérios de Aceitação**

- O título "Empresa do Analista A Ltda" não aparece em nenhum momento

---

### **CT070 - Usuário não vê empresas de outro usuário na lista**

- **Módulo:** Isolamento de dados
- **Rota:** `/empresas`
- **Prioridade:** Alta
- **Tipo:** Permissão

#### **Objetivo**

Validar que a lista de empresas mostra apenas as empresas do usuário logado.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuários A e B criados; dados do usuário A cadastrados
- Usuário B logado, sem empresas próprias
- Ver a divergência conhecida no topo deste arquivo

#### **Dados de Teste**

- Empresa de A: `Empresa do Analista A Ltda`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Logado como B, acessar `/empresas` | É exibida a mensagem "Nenhuma empresa cadastrada. Comece criando o primeiro cliente." |
| 2 | Verificar os cards | O card "Empresa do Analista A Ltda" não é exibido |

#### **Resultados Esperados**

- B não enxerga empresas cadastradas por A

#### **Critérios de Aceitação**

- O botão "Remover Empresa do Analista A Ltda" não existe para B

---

### **CT071 - Usuário não acessa empresa de outro usuário pela URL**

- **Módulo:** Isolamento de dados
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Permissão

#### **Objetivo**

Validar que conhecer a URL da empresa de outro usuário não dá acesso aos dados dela.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuários A e B criados; dados do usuário A cadastrados e URL da empresa de A anotada
- Usuário B logado
- Ver a divergência conhecida no topo deste arquivo

#### **Dados de Teste**

- URL: `/empresas/<id da empresa de A>` e as subpáginas `/importar`, `/plano-de-contas`, `/regras`,
  `/exportar`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Logado como B, acessar `/empresas/<id da empresa de A>` | O título "Empresa do Analista A Ltda" e o CNPJ `44.444.444/0001-44` não são exibidos; os cards mostram "Lançamentos" `0` e a tabela exibe "Nenhum lançamento encontrado. Importe um arquivo OFX para começar." |
| 2 | Acessar `/empresas/<id da empresa de A>/importar` | "Importações recentes" exibe "Nenhuma importação ainda." (o arquivo `extrato-alfa-2026-03.ofx` não é listado) |
| 3 | Acessar `/empresas/<id da empresa de A>/plano-de-contas` | A tabela exibe "Nenhuma conta cadastrada ainda." (a conta "Tarifas bancárias" não é listada) |
| 4 | Acessar `/empresas/<id da empresa de A>/exportar` | O resumo mostra "No período" `0` |

#### **Resultados Esperados**

- Nenhum dado da empresa de A é exibido para B

#### **Critérios de Aceitação**

- Os lançamentos "PIX RECEBIDO CLIENTE BETA" e "TARIFA PACOTE SERVICOS" não aparecem para B

---

### **CT072 - Usuário não altera dados da empresa de outro usuário**

- **Módulo:** Isolamento de dados
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Alta
- **Tipo:** Permissão

#### **Objetivo**

Validar que um usuário não consegue gravar dados na empresa de outro usuário.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuários A e B criados; dados do usuário A cadastrados e URL da empresa de A anotada
- Usuário B logado
- Ver a divergência conhecida no topo deste arquivo

#### **Dados de Teste**

- Conta: Código `9.9`, Nome da conta `Conta invasora`, Tipo Despesa

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Logado como B, acessar `/empresas/<id da empresa de A>/plano-de-contas` | A página não lista a conta "Tarifas bancárias" |
| 2 | Preencher "Código", "Nome da conta" e clicar em "Adicionar" | O toast de erro "Erro ao salvar" é exibido (gravação recusada pela política de RLS) |
| 3 | Clicar em "Sair", entrar como A e abrir "Plano de contas" da empresa | Só a conta "Tarifas bancárias" é listada; "Conta invasora" não existe |

#### **Resultados Esperados**

- Nenhum dado é gravado na empresa de A pelo usuário B

#### **Critérios de Aceitação**

- O toast "Categoria criada" não aparece para B

---

### **CT073 - Voltar no navegador após sair não exibe dados**

- **Módulo:** Isolamento de dados
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Média
- **Tipo:** Permissão

#### **Objetivo**

Validar que, depois de "Sair", o botão "Voltar" do navegador não reabre as páginas da empresa.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário A criado e dados do usuário A cadastrados
- Usuário A logado na página de lançamentos da empresa

#### **Dados de Teste**

- Empresa: `Empresa do Analista A Ltda`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Na página de lançamentos da empresa, clicar em "Sair" | O sistema redireciona para `/auth` |
| 2 | Clicar no botão "Voltar" do navegador | O sistema redireciona novamente para `/auth`, sem exibir os lançamentos |

#### **Resultados Esperados**

- Os dados da empresa só voltam a ser exibidos após novo login

#### **Critérios de Aceitação**

- "PIX RECEBIDO CLIENTE BETA" não aparece depois de "Sair"
