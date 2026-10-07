# Casos de Teste - Regras de Classificação

Rota coberta: `/empresas/$companyId/regras`.

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

Lançamentos: F001 `05/03/2026` "PIX RECEBIDO CLIENTE BETA" `R$ 1.500,00`; F002 `10/03/2026`
"TARIFA PACOTE SERVICOS" `-R$ 45,90`; F003 `15/03/2026` "PAGTO FORNECEDOR GAMA" `-R$ 320,00`;
F004 `20/03/2026` "TARIFA TED" `-R$ 12,50`.

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

---

### **CT040 - Criar regra do tipo "Contém"**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o cadastro de uma regra de classificação e sua exibição na tabela.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão

#### **Dados de Teste**

- Comparação: `Contém`
- Texto procurado na descrição: `TARIFA`
- Categoria: `4.1 · Tarifas bancárias`
- Prioridade: `100` (padrão)

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa e clicar em "Regras" no menu lateral | O card "Nova regra" exibe "Regras são aplicadas na importação, da menor para a maior prioridade. A primeira que combinar define a categoria."; a tabela mostra "Nenhuma regra cadastrada." |
| 2 | Conferir os valores iniciais | "Comparação" em "Contém", "Tipo de valor" em "Qualquer", "Prioridade" `100` e "Categoria" com "Escolha uma conta do plano" |
| 3 | Preencher "Texto procurado na descrição" com `TARIFA` e escolher a categoria "4.1 · Tarifas bancárias" | O botão "Criar regra" fica habilitado |
| 4 | Clicar em "Criar regra" | O toast "Regra criada" é exibido e o campo "Texto procurado na descrição" é limpo |
| 5 | Verificar a tabela | Linha com Ordem `100`, Condição `Contém “TARIFA”`, Categoria "4.1 · Tarifas bancárias" e o interruptor "Ativa" ligado |

#### **Resultados Esperados**

- A regra é gravada ativa

#### **Critérios de Aceitação**

- Ao recarregar a página, a regra continua listada

---

### **CT041 - Criar regra sem escolher a categoria**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que a categoria é obrigatória para criar uma regra.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão

#### **Dados de Teste**

- Texto procurado na descrição: `TARIFA`
- Categoria: não selecionada

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", preencher só "Texto procurado na descrição" | O botão "Criar regra" continua desabilitado |
| 2 | Escolher a categoria "4.1 · Tarifas bancárias" | O botão "Criar regra" fica habilitado |

#### **Resultados Esperados**

- Sem categoria não é possível enviar o formulário

#### **Critérios de Aceitação**

- A tabela continua com "Nenhuma regra cadastrada." enquanto nenhuma regra é criada

---

### **CT042 - Criar regra sem texto e sem filtro de valor**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que a regra precisa de um texto ou de pelo menos um filtro de valor.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão

#### **Dados de Teste**

- Texto procurado na descrição: vazio
- Tipo de valor: `Qualquer`; Valor mínimo e Valor máximo: vazios
- Categoria: `4.1 · Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", escolher apenas a categoria | O botão "Criar regra" fica habilitado |
| 2 | Clicar em "Criar regra" | O toast de erro "Erro ao salvar" é exibido com a descrição "Informe um texto ou pelo menos um filtro de valor." |

#### **Resultados Esperados**

- Nenhuma regra é gravada

#### **Critérios de Aceitação**

- A tabela continua com "Nenhuma regra cadastrada."

---

### **CT043 - Valor mínimo maior que o máximo**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar a consistência da faixa de valores da regra.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão

#### **Dados de Teste**

- Texto procurado na descrição: `TARIFA`
- Valor mínimo: `100`; Valor máximo: `50`
- Categoria: `4.1 · Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", preencher os dados de teste | Os campos ficam preenchidos |
| 2 | Clicar em "Criar regra" | O toast de erro "Erro ao salvar" é exibido com a descrição "O valor mínimo não pode ser maior que o máximo." |

#### **Resultados Esperados**

- Nenhuma regra é gravada e os campos mantêm os valores digitados

#### **Critérios de Aceitação**

- A tabela continua com "Nenhuma regra cadastrada."

---

### **CT044 - Valor mínimo negativo**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Baixa
- **Tipo:** Negativo

#### **Objetivo**

Validar que os filtros de valor não aceitam números negativos.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão

#### **Dados de Teste**

- Texto procurado na descrição: `TARIFA`
- Valor mínimo: `-10`
- Categoria: `4.1 · Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", preencher os dados de teste | Os campos ficam preenchidos |
| 2 | Clicar em "Criar regra" | O toast de erro "Erro ao salvar" é exibido com a descrição "O valor mínimo não pode ser negativo." |

#### **Resultados Esperados**

- Nenhuma regra é gravada

#### **Critérios de Aceitação**

- A tabela continua com "Nenhuma regra cadastrada."

---

### **CT045 - Expressão regular inválida**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Baixa
- **Tipo:** Negativo

#### **Objetivo**

Validar que uma expressão regular mal formada é recusada.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão

#### **Dados de Teste**

- Comparação: `Expressão regular`
- Texto procurado na descrição: `TARIFA[`
- Categoria: `4.1 · Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", escolher "Expressão regular" em "Comparação" e preencher o texto e a categoria | Os campos ficam preenchidos |
| 2 | Clicar em "Criar regra" | O toast de erro "Erro ao salvar" é exibido com a descrição "Expressão regular inválida." |
| 3 | Corrigir o texto para `^TARIFA` e clicar em "Criar regra" | O toast "Regra criada" é exibido e a tabela mostra a Condição `Expressão regular “^TARIFA”` |

#### **Resultados Esperados**

- Só a expressão válida é gravada

#### **Critérios de Aceitação**

- A tabela contém exatamente uma regra

---

### **CT046 - Remover regra**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar a remoção de uma regra e que os lançamentos já classificados por ela mantêm a categoria.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias" criada
- `extrato-alfa-2026-03.ofx` importado (as duas tarifas ficam classificadas pela regra)

#### **Dados de Teste**

- Regra: `Contém “TARIFA”`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", clicar em "Remover regra" na linha da regra | O toast "Regra removida" é exibido, sem diálogo de confirmação |
| 2 | Verificar a tabela | É exibida a mensagem "Nenhuma regra cadastrada." |
| 3 | Abrir "Lançamentos" | "TARIFA PACOTE SERVICOS" e "TARIFA TED" continuam com "4.1 · Tarifas bancárias" |

#### **Resultados Esperados**

- A regra é apagada sem desfazer as classificações já feitas

#### **Critérios de Aceitação**

- O card "Sem categoria" continua com 2

---

### **CT047 - Aplicar regras nos lançamentos pendentes**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que uma regra criada depois da importação pode ser aplicada aos lançamentos sem categoria.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem regras
- `extrato-alfa-2026-03.ofx` importado (os 4 lançamentos ficam "Sem categoria")

#### **Dados de Teste**

- Regra: Comparação `Contém`, texto `TARIFA`, Categoria `4.1 · Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", criar a regra dos dados de teste | O toast "Regra criada" é exibido |
| 2 | Clicar em "Aplicar nos pendentes" | O toast "2 lançamento(s) reclassificado(s)" é exibido |
| 3 | Abrir "Lançamentos" | "TARIFA PACOTE SERVICOS" e "TARIFA TED" estão com "4.1 · Tarifas bancárias" e o selo "regra"; o card "Sem categoria" mostra 2 |
| 4 | Voltar a "Regras" e clicar de novo em "Aplicar nos pendentes" | O toast "0 lançamento(s) reclassificado(s)" é exibido |

#### **Resultados Esperados**

- Apenas os lançamentos que combinam com a regra são classificados

#### **Critérios de Aceitação**

- "PIX RECEBIDO CLIENTE BETA" e "PAGTO FORNECEDOR GAMA" continuam "Sem categoria"

---

### **CT048 - Reprocessar sem nenhuma regra ativa**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar o aviso exibido ao reprocessar quando não há regra ativa.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem regras
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Nenhum dado adicional

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", clicar em "Aplicar nos pendentes" | O toast de erro "Nenhuma regra ativa" é exibido |
| 2 | Clicar em "Reprocessar tudo (mantém ajustes manuais)" | O toast de erro "Nenhuma regra ativa" é exibido novamente |

#### **Resultados Esperados**

- Nenhum lançamento é alterado

#### **Critérios de Aceitação**

- Em "Lançamentos", o card "Sem categoria" continua com 4

---

### **CT049 - Reprocessar tudo mantém os ajustes manuais**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Alta
- **Tipo:** Borda

#### **Objetivo**

Validar que "Reprocessar tudo" reclassifica os lançamentos feitos por regra, mas não altera os
classificados manualmente.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão
- Regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias", prioridade `100`, criada antes da importação
- `extrato-alfa-2026-03.ofx` importado (as duas tarifas ficam classificadas pela regra)
- Em "Lançamentos", a linha "TARIFA TED" alterada manualmente para "4.2 · Fornecedores"

#### **Dados de Teste**

- Nova regra: Comparação `Contém`, texto `PACOTE`, Categoria `4.2 · Fornecedores`, Prioridade `10`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", criar a nova regra | O toast "Regra criada" é exibido e a tabela lista primeiro a regra de Ordem `10` |
| 2 | Clicar em "Aplicar nos pendentes" | O toast "0 lançamento(s) reclassificado(s)" é exibido, pois "TARIFA PACOTE SERVICOS" já tem categoria |
| 3 | Clicar em "Reprocessar tudo (mantém ajustes manuais)" | O toast "1 lançamento(s) reclassificado(s)" é exibido |
| 4 | Abrir "Lançamentos" | "TARIFA PACOTE SERVICOS" está com "4.2 · Fornecedores" e o selo "regra"; "TARIFA TED" continua com "4.2 · Fornecedores" sem o selo "regra" |

#### **Resultados Esperados**

- Apenas o lançamento classificado por regra é reclassificado

#### **Critérios de Aceitação**

- O ajuste manual de "TARIFA TED" é preservado

---

### **CT050 - Regra de menor prioridade vence**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Alta
- **Tipo:** Borda

#### **Objetivo**

Validar que, quando duas regras combinam, vale a de menor número de prioridade.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem lançamentos

#### **Dados de Teste**

- Regra A: Comparação `Contém`, texto `TARIFA`, Categoria `4.1 · Tarifas bancárias`, Prioridade `100`
- Regra B: Comparação `Contém`, texto `TED`, Categoria `4.2 · Fornecedores`, Prioridade `10`
- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", criar a regra A e depois a regra B | A tabela lista a regra de Ordem `10` (`Contém “TED”`) antes da de Ordem `100` (`Contém “TARIFA”`) |
| 2 | Em "Importar OFX", importar `extrato-alfa-2026-03.ofx` | O toast "Extrato importado" é exibido |
| 3 | Conferir a linha "TARIFA TED" | Categoria "4.2 · Fornecedores" com o selo "regra" |
| 4 | Conferir a linha "TARIFA PACOTE SERVICOS" | Categoria "4.1 · Tarifas bancárias" com o selo "regra" |

#### **Resultados Esperados**

- A primeira regra que combina, na ordem de prioridade, define a categoria

#### **Critérios de Aceitação**

- O card "Sem categoria" mostra 2

---

### **CT051 - Regra inativa não é aplicada**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar que desligar o interruptor "Ativa" impede a regra de classificar lançamentos.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem lançamentos
- Regra "Contém" `TARIFA` para "4.1 · Tarifas bancárias" criada

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", desligar o interruptor "Ativa" da regra | O interruptor fica desligado e continua assim ao recarregar a página |
| 2 | Importar `extrato-alfa-2026-03.ofx` | O toast "Extrato importado" é exibido |
| 3 | Conferir a página de lançamentos | Os 4 lançamentos estão com "Sem categoria"; o card "Sem categoria" mostra 4 |
| 4 | Em "Regras", clicar em "Aplicar nos pendentes" | O toast de erro "Nenhuma regra ativa" é exibido |

#### **Resultados Esperados**

- A regra inativa é ignorada na importação e no reprocessamento

#### **Critérios de Aceitação**

- Ao religar o interruptor e clicar em "Aplicar nos pendentes", o toast exibe "2 lançamento(s) reclassificado(s)"

---

### **CT052 - Regra só por valor para saídas**

- **Módulo:** Regras
- **Rota:** `/empresas/$companyId/regras`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar uma regra sem texto, filtrando por "Somente saídas" e valor máximo.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada com o plano de contas padrão, sem lançamentos

#### **Dados de Teste**

- Texto procurado na descrição: vazio
- Tipo de valor: `Somente saídas`
- Valor máximo: `50`
- Categoria: `4.1 · Tarifas bancárias`
- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Regras", criar a regra dos dados de teste | O toast "Regra criada" é exibido; a Condição mostra `Contém “”` seguido de "· Somente saídas · max 50" |
| 2 | Importar `extrato-alfa-2026-03.ofx` | O toast "Extrato importado" é exibido |
| 3 | Conferir a página de lançamentos | "TARIFA PACOTE SERVICOS" (`-R$ 45,90`) e "TARIFA TED" (`-R$ 12,50`) estão com "4.1 · Tarifas bancárias" e o selo "regra" |
| 4 | Conferir os demais lançamentos | "PAGTO FORNECEDOR GAMA" (`-R$ 320,00`, acima do máximo) e "PIX RECEBIDO CLIENTE BETA" (entrada) estão "Sem categoria" |

#### **Resultados Esperados**

- Só as saídas de até `R$ 50,00` são classificadas

#### **Critérios de Aceitação**

- O card "Sem categoria" mostra 2
