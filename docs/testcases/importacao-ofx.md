# Casos de Teste - Importação OFX

Rota coberta: `/empresas/$companyId/importar`.

## Dados fictícios usados neste arquivo

### Usuário e empresa padrão

- Usuário criado pela aba "Criar conta" em `/auth` logo após o reset do banco: Nome completo
  `Analista Teste`, E-mail `analista.teste@contaflux.local`, Senha `Senha@Teste123`
- Empresa `Padaria Fictícia Ltda` (CNPJ `11.111.111/0001-11`) cadastrada pelo botão "Nova empresa",
  pulando as etapas "Plano de contas" e "Contas bancárias"

### Extrato fictício `extrato-alfa-2026-03.ofx`

Conta `12345-6` do banco `0341`, março de 2026, 4 lançamentos (1 crédito e 3 débitos):

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

Totais esperados: Entradas `R$ 1.500,00`; Saídas `-R$ 378,40`.

### Extrato fictício `extrato-alfa-2026-03-ampliado.ofx`

Mesmo conteúdo de `extrato-alfa-2026-03.ofx`, com um quinto lançamento antes de
`</BANKTRANLIST>`:

```
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260328
<TRNAMT>200.00
<FITID>F005
<NAME>PIX RECEBIDO CLIENTE DELTA
</STMTTRN>
```

### Arquivo fictício `extrato-invalido.ofx`

Arquivo de texto com o conteúdo:

```
isto nao e um extrato bancario
```

### Extrato fictício `extrato-vazio.ofx`

```
OFXHEADER:100
<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<BANKACCTFROM>
<BANKID>0341
<ACCTID>12345-6
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260301
<DTEND>20260331
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>
```

---

### **CT022 - Importar extrato OFX válido**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar a prévia e a gravação de um extrato OFX válido.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem contas bancárias, regras ou lançamentos

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa e clicar em "Importar OFX" no menu lateral | O card "Importar extrato OFX" exibe "Selecione o arquivo gerado pelo banco. Lançamentos já importados são ignorados automaticamente." e a área "Arraste o arquivo .ofx aqui ou clique para escolher" |
| 2 | Clicar na área de upload e escolher `extrato-alfa-2026-03.ofx` | A prévia exibe Arquivo `extrato-alfa-2026-03.ofx`, Período `01/03/2026 — 31/03/2026` e Lançamentos `4` |
| 3 | Verificar o campo "Apelido da conta" | Está preenchido com `Conta 12345-6 · banco 0341` |
| 4 | Verificar a tabela da prévia | Lista as 4 linhas com as colunas "Data", "Descrição" e "Valor", ex.: `05/03/2026`, "PIX RECEBIDO CLIENTE BETA", `R$ 1.500,00` |
| 5 | Clicar em "Confirmar importação" | O botão mostra "Importando..."; o toast "Extrato importado" é exibido com a descrição "4 novos lançamentos, 0 repetidos ignorados." |
| 6 | Verificar a página carregada | O sistema abre a página de lançamentos da empresa com `?de=2026-03&ate=2026-03` na URL e a tabela lista os 4 lançamentos |

#### **Resultados Esperados**

- Os 4 lançamentos são gravados e uma conta bancária `Conta 12345-6 · banco 0341` é criada

#### **Critérios de Aceitação**

- O card "Lançamentos" da página da empresa mostra 4
- O seletor "Conta" lista "Conta 12345-6 · banco 0341"

---

### **CT023 - Créditos e débitos importados com sinal e totais corretos**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que créditos ficam positivos, débitos negativos e os totais batem com o extrato.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem regras nem categorias

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Importar OFX", enviar `extrato-alfa-2026-03.ofx` e clicar em "Confirmar importação" | O toast "Extrato importado" é exibido e a página de lançamentos é aberta |
| 2 | Conferir os cards de resumo | "Lançamentos" `4`, "Entradas" `R$ 1.500,00`, "Saídas" `-R$ 378,40`, "Sem categoria" `4` |
| 3 | Conferir a coluna "Valor" | "PIX RECEBIDO CLIENTE BETA" `R$ 1.500,00`; "TARIFA PACOTE SERVICOS" `-R$ 45,90`; "PAGTO FORNECEDOR GAMA" `-R$ 320,00`; "TARIFA TED" `-R$ 12,50` |
| 4 | Conferir a ordem das linhas | Do mais recente para o mais antigo: `20/03/2026`, `15/03/2026`, `10/03/2026`, `05/03/2026` |

#### **Resultados Esperados**

- Os valores exibidos correspondem exatamente ao extrato

#### **Critérios de Aceitação**

- Todos os lançamentos aparecem com a categoria "Sem categoria"

---

### **CT024 - Enviar arquivo que não é OFX**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Alta
- **Tipo:** Negativo

#### **Objetivo**

Validar a mensagem de erro para um arquivo ilegível.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada

#### **Dados de Teste**

- Arquivo: `extrato-invalido.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa e clicar em "Importar OFX" | O card "Importar extrato OFX" é exibido |
| 2 | Escolher `extrato-invalido.ofx` na área de upload | O toast de erro "Não foi possível ler o arquivo" é exibido com a descrição "Arquivo inválido: não parece ser um extrato OFX." |
| 3 | Verificar a página | Nenhuma prévia nem botão "Confirmar importação" é exibido; "Importações recentes" continua com "Nenhuma importação ainda." |

#### **Resultados Esperados**

- Nada é gravado

#### **Critérios de Aceitação**

- A página de lançamentos continua exibindo "Nenhum lançamento encontrado. Importe um arquivo OFX para começar."

---

### **CT025 - Enviar OFX sem lançamentos**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar a mensagem para um OFX bem formado, mas sem nenhum lançamento.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada

#### **Dados de Teste**

- Arquivo: `extrato-vazio.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Importar OFX", escolher `extrato-vazio.ofx` | O toast de erro "Não foi possível ler o arquivo" é exibido com a descrição "Nenhum lançamento encontrado no arquivo." |
| 2 | Verificar a página | Nenhuma prévia é exibida |

#### **Resultados Esperados**

- Nenhuma importação nem conta bancária é criada

#### **Critérios de Aceitação**

- "Importações recentes" continua com "Nenhuma importação ainda."

---

### **CT026 - Reimportar o mesmo extrato ignora lançamentos repetidos**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Alta
- **Tipo:** Borda

#### **Objetivo**

Validar que lançamentos já importados (mesmo FITID na mesma conta) não são duplicados.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `extrato-alfa-2026-03.ofx` já importado com "Confirmar importação"

#### **Dados de Teste**

- Arquivos: `extrato-alfa-2026-03.ofx` e `extrato-alfa-2026-03-ampliado.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Importar OFX", enviar `extrato-alfa-2026-03.ofx` novamente e clicar em "Confirmar importação" | O toast "Extrato importado" é exibido com a descrição "0 novos lançamentos, 4 repetidos ignorados." |
| 2 | Verificar os cards da página de lançamentos | "Lançamentos" continua `4` |
| 3 | Voltar a "Importar OFX", enviar `extrato-alfa-2026-03-ampliado.ofx` e confirmar | O toast exibe "1 novos lançamentos, 4 repetidos ignorados." |
| 4 | Verificar os cards da página de lançamentos | "Lançamentos" passa a `5` e "Entradas" a `R$ 1.700,00` |

#### **Resultados Esperados**

- Só o lançamento novo (`F005`) é gravado

#### **Critérios de Aceitação**

- O seletor "Conta" continua com uma única conta além de "Todas"

---

### **CT027 - Histórico em "Importações recentes"**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar que cada importação é registrada com arquivo, período e contagem de novos e repetidos.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem importações

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx` (importado duas vezes)

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir "Importar OFX" | O card "Importações recentes" exibe "Nenhuma importação ainda." |
| 2 | Importar `extrato-alfa-2026-03.ofx` e voltar a "Importar OFX" | A tabela tem uma linha: Arquivo `extrato-alfa-2026-03.ofx`, Período `01/03/2026 — 31/03/2026`, Novos `4`, Repetidos `0` |
| 3 | Importar o mesmo arquivo de novo e voltar a "Importar OFX" | A nova linha aparece no topo com Novos `0` e Repetidos `4`; a anterior continua abaixo |

#### **Resultados Esperados**

- As importações são listadas da mais recente para a mais antiga

#### **Critérios de Aceitação**

- As colunas exibidas são "Arquivo", "Período", "Novos" e "Repetidos"

---

### **CT028 - Cancelar a prévia da importação**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Baixa
- **Tipo:** Negativo

#### **Objetivo**

Validar que cancelar a prévia descarta o arquivo sem gravar nada.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Importar OFX", escolher `extrato-alfa-2026-03.ofx` | A prévia com "Confirmar importação" e "Cancelar" é exibida |
| 2 | Clicar em "Cancelar" | A prévia some e nenhum toast é exibido |
| 3 | Clicar em "Lançamentos" no menu lateral | É exibido "Nenhum lançamento encontrado. Importe um arquivo OFX para começar." |

#### **Resultados Esperados**

- Nenhum lançamento, importação ou conta bancária é criado

#### **Critérios de Aceitação**

- "Importações recentes" continua com "Nenhuma importação ainda."

---

### **CT029 - Apelido da conta editado na prévia**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar que o apelido digitado na prévia é usado ao criar a conta bancária.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem contas bancárias

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`
- Apelido da conta: `Conta movimento Alfa`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Importar OFX", escolher `extrato-alfa-2026-03.ofx` | O campo "Apelido da conta" mostra `Conta 12345-6 · banco 0341` |
| 2 | Substituir o "Apelido da conta" por `Conta movimento Alfa` e clicar em "Confirmar importação" | O toast "Extrato importado" é exibido |
| 3 | Na página de lançamentos, abrir o seletor "Conta" | As opções são "Todas" e "Conta movimento Alfa" |

#### **Resultados Esperados**

- A conta bancária é criada com o apelido informado

#### **Critérios de Aceitação**

- Nenhuma conta com o apelido `Conta 12345-6 · banco 0341` é criada

---

### **CT030 - Primeira importação usa a conta cadastrada no assistente**

- **Módulo:** Importação OFX
- **Rota:** `/empresas/$companyId/importar`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar que, quando banco e número coincidem com BANKID e ACCTID do OFX, a importação reaproveita a
conta já cadastrada.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa `Oficina Fictícia ME` cadastrada pelo assistente com a conta bancária Apelido `Banco Alfa`,
  Código do banco `0341`, Número da conta `12345-6`

#### **Dados de Teste**

- Arquivo: `extrato-alfa-2026-03.ofx`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa, clicar em "Importar OFX" e escolher `extrato-alfa-2026-03.ofx` | A prévia é exibida |
| 2 | Clicar em "Confirmar importação" | O toast exibe "4 novos lançamentos, 0 repetidos ignorados." |
| 3 | Na página de lançamentos, abrir o seletor "Conta" | As opções são apenas "Todas" e "Banco Alfa" |
| 4 | Selecionar "Banco Alfa" | Os 4 lançamentos continuam listados |

#### **Resultados Esperados**

- Os lançamentos ficam vinculados à conta "Banco Alfa" e nenhuma conta nova é criada

#### **Critérios de Aceitação**

- O apelido digitado na prévia não substitui o apelido "Banco Alfa" já cadastrado
