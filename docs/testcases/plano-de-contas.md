# Casos de Teste - Plano de Contas

Rota coberta: `/empresas/$companyId/plano-de-contas`.

## Dados fictícios usados neste arquivo

### Usuário e empresa padrão

- Usuário criado pela aba "Criar conta" em `/auth` logo após o reset do banco: Nome completo
  `Analista Teste`, E-mail `analista.teste@contaflux.local`, Senha `Senha@Teste123`
- Empresa `Padaria Fictícia Ltda` (CNPJ `11.111.111/0001-11`) cadastrada pelo botão "Nova empresa",
  pulando as etapas "Plano de contas" e "Contas bancárias"

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

### PDF fictício `plano-dominio-ficticio-v2.pdf`

Mesmo conteúdo do anterior, com duas mudanças: a linha da conta 9 passa a ser
`4.2 9 A FORNECEDORES DIVERSOS 2`, é incluída a linha `4.3 10 A ALUGUEL 2` antes do rodapé e o
rodapé passa a ser `Total de Contas Contábeis: 10`.

### PDF fictício `documento-qualquer.pdf`

PDF de texto com uma única linha: `Relatorio sem contas contabeis`.

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

---

### **CT031 - Plano de contas vazio**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar a página de uma empresa sem nenhuma conta no plano.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada

#### **Dados de Teste**

- Nenhum dado adicional

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Abrir a empresa e clicar em "Plano de contas" no menu lateral | São exibidos os campos "Código", "Nome da conta" e "Tipo", o botão "Adicionar" e o botão "Importar do Domínio" |
| 2 | Verificar a tabela | As colunas são "Classificação", "Cód.", "Conta" e "Tipo", e a mensagem é "Nenhuma conta cadastrada ainda." |

#### **Resultados Esperados**

- Nenhuma conta é listada

#### **Critérios de Aceitação**

- O seletor "Tipo" vem com "Despesa" selecionado

---

### **CT032 - Criar conta no plano de contas**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o cadastro manual de contas de diferentes tipos.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem plano de contas

#### **Dados de Teste**

- Conta 1: Código `4.1`, Nome da conta `Tarifas bancárias`, Tipo `Despesa`
- Conta 2: Código vazio, Nome da conta `Receita de serviços`, Tipo `Receita`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Plano de contas", preencher "Código" e "Nome da conta" da conta 1, manter "Tipo" em "Despesa" e clicar em "Adicionar" | O toast "Categoria criada" é exibido e os campos "Código" e "Nome da conta" são limpos |
| 2 | Verificar a tabela | Linha com Classificação `4.1`, Cód. "—", Conta "Tarifas bancárias" e Tipo `despesa` |
| 3 | Preencher só "Nome da conta" da conta 2, escolher "Receita" em "Tipo" e clicar em "Adicionar" | O toast "Categoria criada" é exibido |
| 4 | Verificar a tabela | A conta "Receita de serviços" aparece depois de "Tarifas bancárias", com Classificação "—" e Tipo `receita` |

#### **Resultados Esperados**

- As duas contas são gravadas

#### **Critérios de Aceitação**

- Contas sem classificação ficam no fim da lista
- Na página "Lançamentos", o seletor de categoria lista "4.1 · Tarifas bancárias" e "Receita de serviços"

---

### **CT033 - Adicionar conta sem nome**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que o nome da conta é obrigatório.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem plano de contas

#### **Dados de Teste**

- Código: `4.9`
- Nome da conta: vazio e depois `   ` (somente espaços)

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Plano de contas", preencher apenas "Código" | O botão "Adicionar" fica desabilitado |
| 2 | Preencher "Nome da conta" com três espaços | O botão "Adicionar" continua desabilitado |

#### **Resultados Esperados**

- Nenhuma conta é criada

#### **Critérios de Aceitação**

- A tabela continua com "Nenhuma conta cadastrada ainda."

---

### **CT034 - Importar plano de contas do Domínio**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar a importação do relatório "Plano de Contas" do Domínio em PDF.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem plano de contas
- Arquivo `plano-dominio-ficticio.pdf` gerado conforme a seção de dados fictícios

#### **Dados de Teste**

- Arquivo: `plano-dominio-ficticio.pdf`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Plano de contas", clicar em "Importar do Domínio" | Abre o diálogo "Importar plano de contas do Domínio" com a área "Arraste o PDF do plano de contas do Domínio aqui ou clique para escolher"; o botão "Importar" está desabilitado |
| 2 | Escolher `plano-dominio-ficticio.pdf` | A prévia mostra "plano-dominio-ficticio.pdf · 9 contas lidas · 9 serão importadas" e lista as 9 contas |
| 3 | Digitar `TARIFA` no campo "Filtrar por nome, classificação ou código" | Só a conta "TARIFAS BANCARIAS" fica visível |
| 4 | Limpar o filtro e clicar em "Importar" | O botão mostra "Importando..."; o toast "Plano de contas importado" é exibido com a descrição "9 contas gravadas." e o diálogo fecha |
| 5 | Verificar a tabela | As 9 contas aparecem em ordem de classificação (1, 1.1, 1.1.1, 1.1.1.01, 3, 3.1, 4, 4.1, 4.2) com o código reduzido na coluna "Cód."; as contas S têm o selo "Sintética" |

#### **Resultados Esperados**

- O plano é gravado com classificação, código reduzido, tipo e indicação de sintética

#### **Critérios de Aceitação**

- "RECEITA DE SERVICOS" tem tipo `receita`, "TARIFAS BANCARIAS" e "FORNECEDORES" têm `despesa` e as contas do ATIVO têm `transferencia`

---

### **CT035 - Reimportar plano de contas atualiza sem duplicar**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar que a reimportação atualiza as contas pelo código reduzido, inclui as novas e não altera
contas cadastradas à mão.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `plano-dominio-ficticio.pdf` importado por "Importar do Domínio"
- Conta manual criada com "Adicionar": Código vazio, Nome da conta `Conta manual de teste`, Tipo Despesa

#### **Dados de Teste**

- Arquivo: `plano-dominio-ficticio-v2.pdf`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Importar do Domínio" | O diálogo exibe "Contas que já vieram do Domínio são atualizadas pelo código reduzido; as novas são incluídas. Contas cadastradas à mão não são alteradas." |
| 2 | Escolher `plano-dominio-ficticio-v2.pdf` e clicar em "Importar" | O toast "Plano de contas importado" exibe "10 contas gravadas." |
| 3 | Verificar a tabela | São 11 linhas: as 10 do Domínio e "Conta manual de teste"; a conta de Cód. `9` agora se chama "FORNECEDORES DIVERSOS" e não há "FORNECEDORES" duplicada |
| 4 | Verificar a conta nova | "ALUGUEL" aparece com Classificação `4.3` e Cód. `10` |

#### **Resultados Esperados**

- Nenhuma conta é duplicada e a conta manual permanece inalterada

#### **Critérios de Aceitação**

- Existe exatamente uma linha com Cód. `9`

---

### **CT036 - Importar PDF que não é plano de contas**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar a mensagem quando o PDF não contém contas no formato do Domínio.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada, sem plano de contas

#### **Dados de Teste**

- Arquivo: `documento-qualquer.pdf`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Importar do Domínio" e escolher `documento-qualquer.pdf` | O toast de erro "Nenhuma conta encontrada" é exibido com a descrição "Confira se o arquivo é o relatório Plano de Contas exportado pelo Domínio." |
| 2 | Verificar o diálogo | A área de upload continua visível e o botão "Importar" segue desabilitado |

#### **Resultados Esperados**

- Nenhuma conta é gravada

#### **Critérios de Aceitação**

- Após fechar o diálogo, a tabela continua com "Nenhuma conta cadastrada ainda."

---

### **CT037 - Remover conta sem vínculos**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Média
- **Tipo:** Positivo

#### **Objetivo**

Validar a exclusão de uma conta que não tem regras nem lançamentos.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- Conta criada com "Adicionar": Código `4.1`, Nome da conta `Tarifas bancárias`, Tipo Despesa

#### **Dados de Teste**

- Conta: `Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Clicar em "Remover Tarifas bancárias" | Abre o diálogo 'Excluir a conta "Tarifas bancárias"?' com o texto "As regras que apontam para esta conta serão apagadas e os lançamentos classificados nela voltarão a ficar sem categoria." |
| 2 | Aguardar o cálculo do impacto | O quadro exibe "Nenhum outro registro será afetado." |
| 3 | Clicar em "Excluir" | O toast "Categoria removida" é exibido e o diálogo fecha |

#### **Resultados Esperados**

- A conta é apagada

#### **Critérios de Aceitação**

- A tabela volta a exibir "Nenhuma conta cadastrada ainda."

---

### **CT038 - Remover conta com regras e lançamentos vinculados**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId/plano-de-contas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar o aviso de impacto e o efeito da exclusão: regras apagadas e lançamentos sem categoria.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- Conta criada com "Adicionar": Código `4.1`, Nome da conta `Tarifas bancárias`, Tipo Despesa
- Regra criada em "Regras": Comparação "Contém", texto `TARIFA`, Categoria "4.1 · Tarifas bancárias"
- `extrato-alfa-2026-03.ofx` importado (os lançamentos "TARIFA PACOTE SERVICOS" e "TARIFA TED" ficam
  classificados pela regra)

#### **Dados de Teste**

- Conta: `Tarifas bancárias`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Plano de contas", clicar em "Remover Tarifas bancárias" | O diálogo 'Excluir a conta "Tarifas bancárias"?' é exibido |
| 2 | Conferir o quadro de impacto | São listados "Regras apagadas" 1 e "Lançamentos que ficarão sem categoria" 2 |
| 3 | Clicar em "Excluir" | O toast "Categoria removida" é exibido |
| 4 | Abrir "Regras" | A tabela exibe "Nenhuma regra cadastrada." |
| 5 | Abrir "Lançamentos" | "TARIFA PACOTE SERVICOS" e "TARIFA TED" aparecem com "Sem categoria" e sem o selo "regra"; o card "Sem categoria" mostra 4 |

#### **Resultados Esperados**

- A conta e a regra são apagadas e os lançamentos voltam a ficar pendentes

#### **Critérios de Aceitação**

- Os lançamentos não são apagados; o card "Lançamentos" continua com 4

---

### **CT039 - Contas sintéticas não aparecem para classificação**

- **Módulo:** Plano de contas
- **Rota:** `/empresas/$companyId`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar que só contas analíticas podem ser escolhidas para classificar lançamentos e criar regras.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário padrão criado e logado
- Empresa padrão cadastrada
- `plano-dominio-ficticio.pdf` importado por "Importar do Domínio"
- `extrato-alfa-2026-03.ofx` importado

#### **Dados de Teste**

- Contas sintéticas: ATIVO, ATIVO CIRCULANTE, BANCOS CONTA MOVIMENTO, RECEITAS, DESPESAS

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Em "Lançamentos", abrir o seletor de categoria da linha "TARIFA TED" | As opções são "Sem categoria", "1.1.1.01 · BANCO ALFA AG 1234 C/C 12345-6", "4.2 · FORNECEDORES", "3.1 · RECEITA DE SERVICOS" e "4.1 · TARIFAS BANCARIAS" |
| 2 | Em "Regras", abrir o seletor "Categoria" | Lista as mesmas 4 contas analíticas e nenhuma sintética |

#### **Resultados Esperados**

- Nenhuma conta com o selo "Sintética" é oferecida para classificação

#### **Critérios de Aceitação**

- As opções aparecem no formato "<classificação> · <nome>"
