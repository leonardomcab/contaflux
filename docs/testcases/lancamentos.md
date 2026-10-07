# Casos de Teste - Lançamentos

Rota coberta: `/empresas/$companyId` (revisão, filtros e classificação dos lançamentos).

## Dados fictícios usados neste arquivo

### Usuário, empresa e plano de contas padrão

- Usuário criado pela aba "Criar conta" em `/auth` logo após o reset do banco: Nome completo
  `Analista Teste`, E-mail `analista.teste@contaflux.local`, Senha `Senha@Teste123`
- Empresa `Padaria Fictícia Ltda` (CNPJ `11.111.111/0001-11`) cadastrada pelo botão "Nova empresa",
  pulando as etapas "Plano de contas" e "Contas bancárias"
- Plano de contas padrão, criado em "Plano de contas" com "Adicionar":
  - Código `4.1`, Nome da conta `Tarifas bancárias`, Tipo Despesa
  - Código `4.2`, Nome da conta `Fornecedores`, Tipo Despesa
  - Código `3.1`, Nome da conta `Receita de serviços`, Tipo Receita

### Extrato fictício `extrato-alfa-2026-03.ofx`

Conta `12345-6` do banco `0341` (apelido sugerido `Conta 12345-6 · banco 0341`). Lançamentos:
F001 `05/03/2026` "PIX RECEBIDO CLIENTE BETA" `R$ 1.500,00`; F002 `10/03/2026` "TARIFA PACOTE
SERVICOS" `-R$ 45,90`; F003 `15/03/2026` "PAGTO FORNECEDOR GAMA" `-R$ 320,00`; F004 `20/03/2026`
"TARIFA TED" `-R$ 12,50`.

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
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260315
<TRNAMT>-320.00
<FITID>F003
<NAME>PAGTO FORNECEDOR GAMA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260320
<TRNAMT>-12.50
<FITID>F004
<NAME>TARIFA TED
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
```

### Extrato fictício `extrato-alfa-2026-02.ofx`

Mesma conta, fevereiro de 2026. Lançamentos: F101 `08/02/2026` "PIX RECEBIDO CLIENTE DELTA"
`R$ 800,00`; F102 `18/02/2026` "TARIFA PACOTE SERVICOS" `-R$ 60,00`.

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
<DTSTART>20260201
<DTEND>20260228
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260208
<TRNAMT>800.00
<FITID>F101
<NAME>PIX RECEBIDO CLIENTE DELTA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260218
<TRNAMT>-60.00
<FITID>F102
<NAME>TARIFA PACOTE SERVICOS
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
```

### Extrato fictício `extrato-beta-2026-03.ofx`

Outra conta (`98765-4` do banco `0001`, apelido sugerido `Conta 98765-4 · banco 0001`), março de
2026. Lançamento: G001 `12/03/2026` "RENDIMENTO APLICACAO" `R$ 250,00`.

```
OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>0001
<ACCTID>98765-4
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260331
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260312
<TRNAMT>250.00
<FITID>G001
<NAME>RENDIMENTO APLICACAO
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
```

---

### **CT053 - Empresa sem lançamentos**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar a página de lançamentos antes da primeira importação.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem importações

#### **Dados de Teste**

- Nenhum dado adicional

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa pelo botão "Abrir" | Os cards exibem "Lançamentos" `0`, "Entradas" `R$ 0,00`, "Saídas" `R$ 0,00` e "Sem categoria" `0` |
| 2 | Verificar os filtros "Mês inicial" e "Mês final" | Estão desabilitados com o texto "Sem lançamentos" |
| 3 | Verificar a tabela | Exibe "Nenhum lançamento encontrado. Importe um arquivo OFX para começar." |

#### **Resultados Esperados**

- Nenhum lançamento é listado e não há paginação

#### **Critérios de Aceitação**

- As colunas da tabela são "Data", "Descrição", "Valor" e "Categoria"

---

### **CT054 - Classificação automática na importação**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que as regras ativas classificam os lançamentos no momento da importação.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Regras criadas em "Regras": "Contém" `TARIFA` para "4.1 · Tarifas bancárias" e "Contém" `PIX RECEBIDO`
  com "Tipo de valor" "Somente entradas" para "3.1 · Receita de serviços"

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Importar OFX", importar `extrato-alfa-2026-03.ofx` | O toast "Extrato importado" é exibido e a página de lançamentos é aberta |
| 2 | Conferir as linhas "TARIFA PACOTE SERVICOS" e "TARIFA TED" | Categoria "4.1 · Tarifas bancárias" com o selo "regra" |
| 3 | Conferir a linha "PIX RECEBIDO CLIENTE BETA" | Categoria "3.1 · Receita de serviços" com o selo "regra" |
| 4 | Conferir a linha "PAGTO FORNECEDOR GAMA" | Categoria "Sem categoria", sem selo e com a linha destacada |
| 5 | Conferir os cards | "Lançamentos" `4` e "Sem categoria" `1` |

#### **Resultados Esperados**

- Três lançamentos ficam classificados por regra e um fica pendente para revisão

#### **Critérios de Aceitação**

- Nenhuma ação manual é necessária para os lançamentos que combinam com as regras

---

### **CT055 - Classificar um lançamento manualmente**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar a escolha manual da categoria em uma linha.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem regras
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Lançamento: "PAGTO FORNECEDOR GAMA"
- Categoria: `4.2 · Fornecedores`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Na página de lançamentos, abrir o seletor de categoria da linha "PAGTO FORNECEDOR GAMA" | São listadas "Sem categoria", "4.2 · Fornecedores", "3.1 · Receita de serviços" e "4.1 · Tarifas bancárias" |
| 2 | Escolher "4.2 · Fornecedores" | O toast "Lançamento atualizado" é exibido |
| 3 | Conferir a linha | Mostra "4.2 · Fornecedores" sem o selo "regra" e sem destaque |
| 4 | Conferir o card "Sem categoria" | Passa de `4` para `3` |

#### **Resultados Esperados**

- A categoria escolhida é gravada como ajuste manual

#### **Critérios de Aceitação**

- Ao recarregar a página, a categoria continua gravada

---

### **CT056 - Classificar vários lançamentos em lote**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar a seleção de várias linhas e a aplicação de uma categoria a todas.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem regras
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Lançamentos: "TARIFA PACOTE SERVICOS" e "TARIFA TED"
- Categoria: `4.1 · Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Marcar "Selecionar lançamento" nas linhas "TARIFA PACOTE SERVICOS" e "TARIFA TED" | Surge a barra com "2 selecionado(s)", o seletor "Aplicar categoria..." e os botões "Aplicar", "Limpar categoria" e "Cancelar"; "Aplicar" está desabilitado |
| 2 | Escolher "4.1 · Tarifas bancárias" em "Aplicar categoria..." | O botão "Aplicar" fica habilitado |
| 3 | Clicar em "Aplicar" | O toast "2 lançamentos atualizados" é exibido e a barra de seleção some |
| 4 | Conferir as duas linhas e o card "Sem categoria" | As duas mostram "4.1 · Tarifas bancárias" e o card passa a `2` |
| 5 | Marcar "Selecionar todos desta página" e depois clicar em "Cancelar" | A barra mostra "4 selecionado(s)" e, após "Cancelar", some sem alterar nenhuma categoria |

#### **Resultados Esperados**

- A categoria é aplicada só às linhas selecionadas

#### **Critérios de Aceitação**

- "PIX RECEBIDO CLIENTE BETA" e "PAGTO FORNECEDOR GAMA" continuam "Sem categoria"

---

### **CT057 - Limpar categoria em lote**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar que "Limpar categoria" devolve os lançamentos selecionados para "Sem categoria".

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias" criada antes da importação
- `extrato-alfa-2026-03.ofx` importado (as duas tarifas ficam classificadas pela regra)

#### **Dados de Teste**

- Lançamentos: "TARIFA PACOTE SERVICOS" e "TARIFA TED"

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Marcar "Selecionar lançamento" nas duas linhas de tarifa | A barra mostra "2 selecionado(s)" |
| 2 | Clicar em "Limpar categoria" | O toast "2 lançamentos atualizados" é exibido |
| 3 | Conferir as duas linhas | Mostram "Sem categoria", sem o selo "regra" |
| 4 | Conferir o card "Sem categoria" | Mostra `4` |

#### **Resultados Esperados**

- As categorias são removidas sem apagar os lançamentos

#### **Critérios de Aceitação**

- O card "Lançamentos" continua com `4`

---

### **CT058 - Filtrar por situação**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar o filtro "Situação" para separar pendentes e classificados.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias" criada antes da importação
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Situações: "Sem categoria", "Classificados" e "Todas"

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Na página de lançamentos, escolher "Sem categoria" em "Situação" | São listados só "PIX RECEBIDO CLIENTE BETA" e "PAGTO FORNECEDOR GAMA"; o card "Lançamentos" mostra `2` |
| 2 | Escolher "Classificados" | São listados só "TARIFA PACOTE SERVICOS" e "TARIFA TED"; o card "Sem categoria" mostra `0` |
| 3 | Escolher "Todas" | Os 4 lançamentos voltam a ser listados |

#### **Resultados Esperados**

- A tabela e os cards de resumo respeitam o filtro escolhido

#### **Critérios de Aceitação**

- Com "Classificados", o card "Saídas" mostra `-R$ 58,40`

---

### **CT059 - Buscar pela descrição**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar o filtro de texto do campo "Descrição".

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Buscas: `tarifa` e `inexistente`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Digitar `tarifa` no campo "Descrição" (placeholder "Buscar...") | São listados "TARIFA PACOTE SERVICOS" e "TARIFA TED", sem diferenciar maiúsculas e minúsculas |
| 2 | Conferir os cards | "Lançamentos" `2` e "Saídas" `-R$ 58,40` |
| 3 | Substituir a busca por `inexistente` | A tabela exibe "Nenhum lançamento encontrado. Importe um arquivo OFX para começar." |
| 4 | Limpar o campo | Os 4 lançamentos voltam a ser listados |

#### **Resultados Esperados**

- Só as descrições que contêm o texto digitado são listadas

#### **Critérios de Aceitação**

- Os cards de resumo acompanham a busca

---

### **CT060 - Filtrar por conta bancária**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar o filtro "Conta" quando a empresa tem extratos de duas contas.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `extrato-alfa-2026-03.ofx` e `extrato-beta-2026-03.ofx` importados, mantendo os apelidos sugeridos

#### **Dados de Teste**

- Contas: `Conta 12345-6 · banco 0341` e `Conta 98765-4 · banco 0001`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Na página de lançamentos, conferir os cards com "Conta" em "Todas" | "Lançamentos" `5` e "Entradas" `R$ 1.750,00` |
| 2 | Escolher "Conta 98765-4 · banco 0001" em "Conta" | Só "RENDIMENTO APLICACAO" (`R$ 250,00`) é listado; "Lançamentos" `1` |
| 3 | Escolher "Conta 12345-6 · banco 0341" | São listados os 4 lançamentos do extrato alfa |

#### **Resultados Esperados**

- Cada conta mostra apenas os próprios lançamentos

#### **Critérios de Aceitação**

- O seletor "Conta" lista "Todas" e as duas contas

---

### **CT061 - Filtrar por período**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o mês exibido por padrão e os filtros "Mês inicial" e "Mês final".

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `extrato-alfa-2026-02.ofx` e `extrato-alfa-2026-03.ofx` importados

#### **Dados de Teste**

- Meses: `fev/2026` e `mar/2026`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Ir para "Empresas" e clicar em "Abrir" na empresa | "Mês inicial" e "Mês final" mostram "mar/2026" (mês mais recente) e são listados os 4 lançamentos de março |
| 2 | Escolher "fev/2026" em "Mês inicial" | São listados 6 lançamentos; a URL contém `de=2026-02&ate=2026-03`; "Entradas" mostra `R$ 2.300,00` |
| 3 | Escolher "fev/2026" em "Mês final" | São listados só os 2 lançamentos de fevereiro |
| 4 | Escolher "Todos os períodos" em "Mês inicial" | São listados os 6 lançamentos e a URL contém `todos=true` |
| 5 | Recarregar a página | O filtro "Todos os períodos" é mantido |

#### **Resultados Esperados**

- A tabela e os cards mostram apenas os lançamentos do período escolhido

#### **Critérios de Aceitação**

- As opções dos seletores de mês são "Todos os períodos", "mar/2026" e "fev/2026"

---

### **CT062 - Voltar um lançamento para "Sem categoria"**

- **Módulo:** Lançamentos
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar que é possível desfazer a classificação de uma linha pelo próprio seletor.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias" criada antes da importação
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Lançamento: "TARIFA TED"

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | No seletor de categoria da linha "TARIFA TED", escolher "Sem categoria" | O toast "Lançamento atualizado" é exibido |
| 2 | Conferir a linha | Mostra "Sem categoria", sem o selo "regra" e com destaque |
| 3 | Conferir o card "Sem categoria" | Passa de `2` para `3` |

#### **Resultados Esperados**

- O lançamento volta a ficar pendente

#### **Critérios de Aceitação**

- "TARIFA PACOTE SERVICOS" continua com "4.1 · Tarifas bancárias" e o selo "regra"
