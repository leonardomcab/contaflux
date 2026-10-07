# Casos de Teste - Autenticação

Rotas cobertas: `/auth`, `/` e a proteção das rotas em `/_authenticated/*`.

---

### **CT001 - Login com credenciais válidas**

- **Módulo:** Autenticação
- **Rota:** `/auth`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que um usuário cadastrado consegue entrar no sistema e é levado à lista de empresas.

#### **Pré-Condições**

- Ambiente local rodando (`./scripts/setup-local-supabase.sh` e `npm run dev`) com banco resetado
  (`npx supabase db reset`)
- Usuário `analista.teste@contaflux.local` cadastrado pela aba "Criar conta" e com e-mail confirmado
- Nenhuma sessão ativa no navegador (clicar em "Sair" após o cadastro)

#### **Dados de Teste**

- E-mail: `analista.teste@contaflux.local`
- Senha: `Senha@Teste123`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/auth` | A página exibe o título "Extratos e classificação", o card "Acesso" e a aba "Entrar" selecionada |
| 2 | Preencher os campos "E-mail" e "Senha" com os dados de teste | Os campos ficam preenchidos, sem mensagem de erro |
| 3 | Clicar no botão "Entrar" do formulário (não na aba) | O botão mostra "Entrando..." e o sistema redireciona para `/empresas` |
| 4 | Verificar a página carregada | O título "Empresas" é exibido |

#### **Resultados Esperados**

- O usuário fica autenticado e permanece logado ao recarregar a página
- A URL final é `/empresas`

#### **Critérios de Aceitação**

- Nenhum toast "Não foi possível entrar" é exibido
- As rotas autenticadas ficam acessíveis sem novo login

---

### **CT002 - Login com senha incorreta**

- **Módulo:** Autenticação
- **Rota:** `/auth`
- **Prioridade:** Alta
- **Tipo:** Negativo

#### **Objetivo**

Validar que o sistema recusa o login quando a senha não corresponde ao usuário cadastrado.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário `analista.teste@contaflux.local` / `Senha@Teste123` cadastrado pela aba "Criar conta"
- Nenhuma sessão ativa no navegador

#### **Dados de Teste**

- E-mail: `analista.teste@contaflux.local`
- Senha: `SenhaErrada999`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/auth` | A aba "Entrar" está selecionada |
| 2 | Preencher "E-mail" e "Senha" com os dados de teste | Os campos ficam preenchidos |
| 3 | Clicar no botão "Entrar" do formulário | Um toast de erro "Não foi possível entrar" é exibido, com a descrição retornada pelo Supabase Auth (ex.: "Invalid login credentials") |
| 4 | Verificar a URL | A URL continua `/auth` e o botão volta a exibir "Entrar" |

#### **Resultados Esperados**

- O usuário não é autenticado e permanece na tela de acesso

#### **Critérios de Aceitação**

- Não há redirecionamento para `/empresas`
- Acessar `/empresas` em seguida redireciona de volta para `/auth`

---

### **CT003 - Criar conta com dados válidos**

- **Módulo:** Autenticação
- **Rota:** `/auth`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que um novo membro da equipe consegue criar a conta e já entra no sistema.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado (confirmação de e-mail desligada, padrão do Supabase local)
- Nenhuma sessão ativa no navegador

#### **Dados de Teste**

- Nome completo: `Ana Teste Fictícia`
- E-mail: `ana.teste@contaflux.local`
- Senha: `Senha@Teste123`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/auth` e clicar na aba "Criar conta" | O formulário exibe os campos "Nome completo", "E-mail" e "Senha" e o botão "Criar conta" |
| 2 | Preencher os três campos com os dados de teste | Os campos ficam preenchidos |
| 3 | Clicar no botão "Criar conta" do formulário | O botão mostra "Criando..."; um toast "Conta criada" é exibido com a descrição "Verifique seu e-mail se a confirmação for exigida." |
| 4 | Verificar a página carregada | A URL é `/empresas`, o título "Empresas" é exibido e o rodapé do menu lateral mostra `ana.teste@contaflux.local` |

#### **Resultados Esperados**

- A conta é criada e o usuário fica autenticado

#### **Critérios de Aceitação**

- Após clicar em "Sair", é possível entrar novamente pela aba "Entrar" com o mesmo e-mail e senha

---

### **CT004 - Criar conta com e-mail já cadastrado**

- **Módulo:** Autenticação
- **Rota:** `/auth`
- **Prioridade:** Média
- **Tipo:** Negativo

#### **Objetivo**

Validar que não é possível criar uma segunda conta com um e-mail já existente.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário `analista.teste@contaflux.local` / `Senha@Teste123` cadastrado pela aba "Criar conta"
- Nenhuma sessão ativa no navegador (clicar em "Sair")

#### **Dados de Teste**

- Nome completo: `Outro Analista`
- E-mail: `analista.teste@contaflux.local`
- Senha: `OutraSenha@456`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/auth` e clicar na aba "Criar conta" | O formulário de cadastro é exibido |
| 2 | Preencher "Nome completo", "E-mail" e "Senha" com os dados de teste | Os campos ficam preenchidos |
| 3 | Clicar no botão "Criar conta" do formulário | Um toast de erro "Não foi possível criar a conta" é exibido, com a descrição retornada pelo Supabase Auth (ex.: "User already registered") |
| 4 | Verificar a URL | A URL continua `/auth` |

#### **Resultados Esperados**

- Nenhuma conta nova é criada e o usuário não é autenticado

#### **Critérios de Aceitação**

- O login com `analista.teste@contaflux.local` / `Senha@Teste123` continua funcionando
- O login com a senha `OutraSenha@456` é recusado

---

### **CT005 - Criar conta com senha menor que 6 caracteres**

- **Módulo:** Autenticação
- **Rota:** `/auth`
- **Prioridade:** Média
- **Tipo:** Borda

#### **Objetivo**

Validar que o formulário de cadastro exige senha com pelo menos 6 caracteres.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Nenhuma sessão ativa no navegador

#### **Dados de Teste**

- Nome completo: `Bruno Teste Fictício`
- E-mail: `bruno.teste@contaflux.local`
- Senha: `12345` (5 caracteres)

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/auth` e clicar na aba "Criar conta" | O formulário de cadastro é exibido |
| 2 | Preencher os campos com os dados de teste | Os campos ficam preenchidos |
| 3 | Clicar no botão "Criar conta" do formulário | O navegador bloqueia o envio e exibe a validação nativa do campo "Senha" (mínimo de 6 caracteres); o botão não muda para "Criando..." |
| 4 | Alterar a senha para `123456` e clicar em "Criar conta" | O toast "Conta criada" é exibido e o sistema redireciona para `/empresas` |

#### **Resultados Esperados**

- Com 5 caracteres a conta não é criada; com 6 caracteres a conta é criada

#### **Critérios de Aceitação**

- Nenhum toast é exibido na tentativa com 5 caracteres, pois o formulário não é enviado

---

### **CT006 - Acessar rota protegida sem sessão**

- **Módulo:** Autenticação
- **Rota:** `/empresas`
- **Prioridade:** Alta
- **Tipo:** Permissão

#### **Objetivo**

Validar que as rotas autenticadas redirecionam para a tela de acesso quando não há sessão.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Nenhuma sessão ativa no navegador (usar janela anônima)

#### **Dados de Teste**

- URLs: `/`, `/empresas`, `/empresas/00000000-0000-0000-0000-000000000000/importar`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/` | O sistema redireciona para `/auth` e exibe o card "Acesso" |
| 2 | Acessar `/empresas` | O sistema redireciona para `/auth` |
| 3 | Acessar `/empresas/00000000-0000-0000-0000-000000000000/importar` | O sistema redireciona para `/auth` |

#### **Resultados Esperados**

- Nenhuma tela autenticada (menu lateral, título "Empresas") é exibida sem login

#### **Critérios de Aceitação**

- Todas as URLs protegidas terminam em `/auth`

---

### **CT007 - Acessar a tela de acesso com sessão ativa**

- **Módulo:** Autenticação
- **Rota:** `/auth`
- **Prioridade:** Baixa
- **Tipo:** Borda

#### **Objetivo**

Validar que um usuário já autenticado que abre `/auth` é levado direto para a lista de empresas.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário `analista.teste@contaflux.local` / `Senha@Teste123` cadastrado e logado

#### **Dados de Teste**

- URL: `/auth`

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Com a sessão ativa, digitar `/auth` na barra de endereço | O sistema redireciona para `/empresas` |
| 2 | Verificar a página | O título "Empresas" é exibido |

#### **Resultados Esperados**

- O usuário continua autenticado e não precisa entrar de novo

#### **Critérios de Aceitação**

- A URL final é `/empresas`

---

### **CT008 - Sair do sistema**

- **Módulo:** Autenticação
- **Rota:** `/empresas`
- **Prioridade:** Alta
- **Tipo:** Positivo

#### **Objetivo**

Validar que o botão "Sair" encerra a sessão e bloqueia o acesso às rotas autenticadas.

#### **Pré-Condições**

- Ambiente local rodando com banco resetado
- Usuário `analista.teste@contaflux.local` / `Senha@Teste123` cadastrado e logado

#### **Dados de Teste**

- Nenhum dado adicional

#### **Passos**

| **Id** | **Ação** | **Resultado Esperado** |
|--------|----------|------------------------|
| 1 | Acessar `/empresas` | O título "Empresas" é exibido e o rodapé do menu lateral mostra `analista.teste@contaflux.local` |
| 2 | Clicar em "Sair" no rodapé do menu lateral | O sistema redireciona para `/auth` |
| 3 | Acessar `/empresas` pela barra de endereço | O sistema redireciona para `/auth` |
| 4 | Recarregar a página | A tela de acesso continua sendo exibida |

#### **Resultados Esperados**

- A sessão é encerrada

#### **Critérios de Aceitação**

- Só é possível voltar a `/empresas` após um novo login
