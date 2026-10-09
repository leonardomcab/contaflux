# Casos de Teste - Exportação

Rota coberta: `/empresas/$companyId/exportar`.

> **Escopo atual:** a tela gera o **TXT Domínio** (formato padrão, botão "Baixar TXT") e o **CSV**
> (botão "Baixar CSV"). Nos casos de CSV (CT063 a CT068), escolher "CSV (planilha)" em "Formato"
> antes de qualquer outro passo.
>
> No CSV, a coluna "Data" sai no formato `aaaa-mm-dd` e a coluna "Valor" com vírgula decimal e sem
> símbolo de moeda (ex.: `-45,90`), exatamente como o código gera hoje.
>
> O TXT segue o leiaute de importação de lançamentos do Domínio: linha `|0000|<CNPJ>|` e, para cada
> lançamento, `|6000|X||||` seguido de `|6100|dd/mm/aaaa|<débito>|<crédito>|<valor>||<histórico>||||`,
> com contas pelo código reduzido, UTF-8 sem BOM e quebra de linha LF.

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

### Classificação padrão de março

1. Criar em "Regras" a regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias"
2. Importar `extrato-alfa-2026-03.ofx` em "Importar OFX", mantendo o apelido sugerido
   `Conta 12345-6 · banco 0341` (as duas tarifas ficam classificadas pela regra)
3. Em "Lançamentos", escolher manualmente "4.2 · Fornecedores" na linha "PAGTO FORNECEDOR GAMA"

Resultado: 4 lançamentos em março, 3 classificados (2 por regra e 1 manual) e 1 sem categoria
("PIX RECEBIDO CLIENTE BETA").

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

---

### **CT063 - Exportar CSV somente com lançamentos classificados**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o resumo do período e o conteúdo do CSV com a opção padrão "Somente classificados".

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Classificação padrão de março executada

#### **Dados de Teste**

- Incluir: `Somente classificados`
- Período: `mar/2026`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Exportar" no menu lateral e escolher "CSV (planilha)" em "Formato" | O card "Exportar lançamentos" exibe "Gera um arquivo CSV (separado por ponto e vírgula) pronto para abrir no Excel."; "Mês inicial" e "Mês final" mostram "mar/2026" e "Incluir" mostra "Somente classificados" |
| 2 | Conferir o resumo | "No período" `4`, "Sem categoria" `1`, "Entradas" `R$ 1.500,00`, "Saídas" `-R$ 378,40` |
| 3 | Conferir o aviso abaixo do resumo | É exibido "1 lançamento(s) ficam de fora por ainda não terem categoria." |
| 4 | Clicar em "Baixar CSV" | O botão mostra "Gerando..."; o toast "3 lançamentos exportados" é exibido e o arquivo `lancamentos_2026-03.csv` é baixado |
| 5 | Abrir o arquivo em um editor de texto | Primeira linha: `"Data";"Conta bancária";"Descrição";"Histórico";"Valor";"Tipo";"Conta contábil";"Classificação"` |
| 6 | Conferir as linhas de dados, em ordem de data | `"2026-03-10";"Conta 12345-6 · banco 0341";"TARIFA PACOTE SERVICOS";"";"-45,90";"Débito";"4.1 Tarifas bancárias";"Regra"`, depois `"2026-03-15";...;"PAGTO FORNECEDOR GAMA";"";"-320,00";"Débito";"4.2 Fornecedores";"Manual"` e `"2026-03-20";...;"TARIFA TED";"";"-12,50";"Débito";"4.1 Tarifas bancárias";"Regra"` |

#### **Resultados Esperados**

- O CSV contém apenas os 3 lançamentos classificados do período

#### **Critérios de Aceitação**

- "PIX RECEBIDO CLIENTE BETA" não aparece no arquivo
- Ao abrir o arquivo no Excel, os acentos ("Descrição", "Débito") aparecem corretamente

---

### **CT064 - Exportar CSV com todos os lançamentos**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar a opção "Todos", que inclui classificados e pendentes.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Classificação padrão de março executada

#### **Dados de Teste**

- Incluir: `Todos`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Exportar", escolher "Todos" em "Incluir" | O aviso "1 lançamento(s) ficam de fora por ainda não terem categoria." deixa de ser exibido |
| 2 | Clicar em "Baixar CSV" | O toast "4 lançamentos exportados" é exibido e `lancamentos_2026-03.csv` é baixado |
| 3 | Conferir a primeira linha de dados do arquivo | `"2026-03-05";"Conta 12345-6 · banco 0341";"PIX RECEBIDO CLIENTE BETA";"";"1500,00";"Crédito";"";""` |

#### **Resultados Esperados**

- O CSV contém os 4 lançamentos do período, com "Conta contábil" e "Classificação" vazias no pendente

#### **Critérios de Aceitação**

- O arquivo tem 5 linhas: o cabeçalho e 4 lançamentos

---

### **CT065 - Exportar CSV somente com lançamentos pendentes**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar a opção "Somente pendentes".

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Classificação padrão de março executada

#### **Dados de Teste**

- Incluir: `Somente pendentes`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Exportar", escolher "Somente pendentes" em "Incluir" | O seletor mostra "Somente pendentes" |
| 2 | Clicar em "Baixar CSV" | O toast "1 lançamentos exportados" é exibido e `lancamentos_2026-03.csv` é baixado |
| 3 | Conferir o arquivo | Contém o cabeçalho e uma linha com "PIX RECEBIDO CLIENTE BETA" |

#### **Resultados Esperados**

- Só o lançamento sem categoria é exportado

#### **Critérios de Aceitação**

- Nenhum lançamento classificado aparece no arquivo

---

### **CT066 - Exportar com filtro que não retorna lançamentos**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar a mensagem quando o filtro escolhido não tem nenhum lançamento.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Classificação padrão de março executada
- Em "Lançamentos", "PIX RECEBIDO CLIENTE BETA" classificado manualmente em "3.1 · Receita de serviços"
  (nenhum pendente)

#### **Dados de Teste**

- Incluir: `Somente pendentes`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Exportar", conferir o resumo | "Sem categoria" mostra `0` |
| 2 | Escolher "Somente pendentes" em "Incluir" e clicar em "Baixar CSV" | O toast de erro "Nenhum lançamento no filtro escolhido" é exibido |

#### **Resultados Esperados**

- Nenhum arquivo é baixado

#### **Critérios de Aceitação**

- O botão volta a exibir "Baixar CSV"

---

### **CT067 - Exportar em empresa sem lançamentos**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar a tela de exportação antes da primeira importação.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem importações

#### **Dados de Teste**

- Incluir: `Todos`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa e clicar em "Exportar" | "Mês inicial" e "Mês final" estão desabilitados com "Sem lançamentos" |
| 2 | Conferir o resumo | "No período" `0`, "Sem categoria" `0`, "Entradas" `R$ 0,00`, "Saídas" `R$ 0,00` |
| 3 | Escolher "Todos" em "Incluir" e clicar em "Baixar CSV" | O toast de erro "Nenhum lançamento no filtro escolhido" é exibido |

#### **Resultados Esperados**

- Nenhum arquivo é baixado

#### **Critérios de Aceitação**

- Nenhum erro diferente de "Nenhum lançamento no filtro escolhido" é exibido

---

### **CT068 - Nome do arquivo conforme o período**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar o nome do CSV para intervalo de meses e para "Todos os períodos".

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `extrato-alfa-2026-02.ofx` e `extrato-alfa-2026-03.ofx` importados

#### **Dados de Teste**

- Incluir: `Todos`
- Períodos: `fev/2026` a `mar/2026` e "Todos os períodos"

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Exportar", escolher "Todos" em "Incluir" e "fev/2026" em "Mês inicial" | O resumo mostra "No período" `6` |
| 2 | Clicar em "Baixar CSV" | O toast "6 lançamentos exportados" é exibido e o arquivo `lancamentos_2026-02_a_2026-03.csv` é baixado |
| 3 | Escolher "Todos os períodos" em "Mês inicial" e clicar em "Baixar CSV" | O arquivo `lancamentos_todos.csv` é baixado com os mesmos 6 lançamentos |
| 4 | Escolher "fev/2026" em "Mês inicial" e em "Mês final" e clicar em "Baixar CSV" | O toast "2 lançamentos exportados" é exibido e o arquivo `lancamentos_2026-02.csv` é baixado |

#### **Resultados Esperados**

- O nome do arquivo identifica o período exportado

#### **Critérios de Aceitação**

- Os lançamentos de cada arquivo pertencem apenas ao período do nome

---

### Preparação para os casos de TXT Domínio

Usa o PDF fictício `plano-dominio-ficticio.pdf` descrito em
[plano-de-contas.md](plano-de-contas.md#pdf-fictício-plano-dominio-ficticiopdf), cujos códigos
reduzidos são: `4` BANCO ALFA AG 1234 C/C 12345-6, `6` RECEITA DE SERVICOS, `8` TARIFAS BANCARIAS e
`9` FORNECEDORES.

1. Cadastrar a empresa padrão (`Padaria Fictícia Ltda`, CNPJ `11.111.111/0001-11`)
2. Em "Plano de contas", importar `plano-dominio-ficticio.pdf` por "Importar do Domínio"
3. Em "Regras", criar a regra "Contém" `TARIFA` para "4.1 · TARIFAS BANCARIAS"
4. Importar `extrato-alfa-2026-03.ofx` mantendo o apelido sugerido `Conta 12345-6 · banco 0341`
5. Em "Lançamentos", escolher "4.2 · FORNECEDORES" em "PAGTO FORNECEDOR GAMA" e
   "3.1 · RECEITA DE SERVICOS" em "PIX RECEBIDO CLIENTE BETA"

---

### **CT074 - Exportar TXT Domínio do mês**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o vínculo da conta bancária com o plano de contas e o conteúdo exato do TXT.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- "Preparação para os casos de TXT Domínio" executada

#### **Dados de Teste**

- Conta contábil do banco: `4 · 1.1.1.01 BANCO ALFA AG 1234 C/C 12345-6`
- Período: `mar/2026`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Exportar" no menu lateral | "Formato" mostra "TXT Domínio", "Incluir" está desabilitado em "Somente classificados" e o card "Contas bancárias no Domínio" lista `Conta 12345-6 · banco 0341` com "Sem conta contábil" |
| 2 | Conferir as pendências | O quadro "Resolva as pendências abaixo para gerar o arquivo" lista "Contas bancárias sem conta contábil vinculada (1)" com `Conta 12345-6 · banco 0341`; "Baixar TXT" está desabilitado |
| 3 | Abrir o seletor da conta bancária | As opções são "Sem conta contábil" e as 4 contas analíticas no formato "<código reduzido> · <classificação> <nome>"; nenhuma sintética |
| 4 | Escolher `4 · 1.1.1.01 BANCO ALFA AG 1234 C/C 12345-6` | O quadro de pendências some e "Baixar TXT" fica habilitado |
| 5 | Clicar em "Baixar TXT" | O toast "4 lançamentos exportados" é exibido e o arquivo `lancamento_PADARIAFICTICIALTDA_032026.txt` é baixado |
| 6 | Abrir o arquivo em um editor de texto | O conteúdo é exatamente o bloco abaixo |

```
|0000|11111111000111|
|6000|X||||
|6100|05/03/2026|4|6|1500,00||PIX RECEBIDO CLIENTE BETA||||
|6000|X||||
|6100|10/03/2026|8|4|45,90||TARIFA PACOTE SERVICOS||||
|6000|X||||
|6100|15/03/2026|9|4|320,00||PAGTO FORNECEDOR GAMA||||
|6000|X||||
|6100|20/03/2026|8|4|12,50||TARIFA TED||||
```

#### **Resultados Esperados**

- Entradas debitam o banco (`4`) e creditam a categoria; saídas debitam a categoria e creditam o banco

#### **Critérios de Aceitação**

- O editor identifica o arquivo como UTF-8 sem BOM e com quebra de linha LF (Unix)
- Ao reabrir a tela, a conta bancária continua vinculada a `4 · 1.1.1.01 BANCO ALFA AG 1234 C/C 12345-6`

---

### **CT075 - Lançamentos sem categoria ficam fora do TXT**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar que o TXT só leva lançamentos classificados e avisa quantos ficaram de fora.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- "Preparação para os casos de TXT Domínio" executada, sem o passo 5 para "PIX RECEBIDO CLIENTE BETA"
- Conta bancária vinculada a `4 · 1.1.1.01 BANCO ALFA AG 1234 C/C 12345-6` (CT074, passo 4)

#### **Dados de Teste**

- Período: `mar/2026`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir "Exportar" | É exibido "1 lançamento(s) ficam de fora por ainda não terem categoria." e não há quadro de pendências |
| 2 | Clicar em "Baixar TXT" | O toast "3 lançamentos exportados" é exibido |
| 3 | Abrir o arquivo | Contém o cabeçalho `0000` e 3 pares `6000`/`6100`; "PIX RECEBIDO CLIENTE BETA" não aparece |

#### **Resultados Esperados**

- O arquivo é gerado só com os 3 lançamentos classificados

#### **Critérios de Aceitação**

- O arquivo tem 7 linhas

---

### **CT076 - Conta sem código reduzido bloqueia o TXT**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Alta
- **Tipo:** Negativo

#### **Objetivo**

Validar que lançamentos classificados em conta cadastrada à mão (sem código reduzido do Domínio)
impedem a geração do arquivo.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- "Preparação para os casos de TXT Domínio" executada
- Conta bancária vinculada a `4 · 1.1.1.01 BANCO ALFA AG 1234 C/C 12345-6`
- Em "Plano de contas", conta criada com "Adicionar": Código vazio, Nome da conta
  `Conta manual de teste`, Tipo Despesa
- Em "Lançamentos", "TARIFA TED" reclassificado manualmente em "Conta manual de teste"

#### **Dados de Teste**

- Período: `mar/2026`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir "Exportar" | O quadro de pendências lista "Contas sem código reduzido do Domínio (1)" com `Conta manual de teste` |
| 2 | Verificar o botão | "Baixar TXT" está desabilitado |
| 3 | Em "Lançamentos", voltar "TARIFA TED" para "4.1 · TARIFAS BANCARIAS" e abrir "Exportar" de novo | O quadro de pendências some e "Baixar TXT" fica habilitado |

#### **Resultados Esperados**

- Nenhum arquivo é gerado enquanto houver lançamento em conta sem código reduzido

#### **Critérios de Aceitação**

- A conta manual não aparece no seletor de conta contábil das contas bancárias

---

### **CT077 - Empresa sem CNPJ bloqueia o TXT**

- **Módulo:** Exportação
- **Rota:** `/empresas/$companyId/exportar`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que o TXT exige o CNPJ da empresa, usado no registro `0000`.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- "Preparação para os casos de TXT Domínio" executada, cadastrando a empresa **sem** CNPJ
- Conta bancária vinculada a `4 · 1.1.1.01 BANCO ALFA AG 1234 C/C 12345-6`

#### **Dados de Teste**

- Período: `mar/2026`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir "Exportar" | O quadro de pendências lista "Empresa sem CNPJ válido (14 dígitos) (1)" com "CNPJ não informado" |
| 2 | Verificar o botão | "Baixar TXT" está desabilitado |

#### **Resultados Esperados**

- Nenhum arquivo é gerado sem CNPJ

#### **Critérios de Aceitação**

- Ao escolher "CSV (planilha)" em "Formato", "Baixar CSV" continua habilitado
