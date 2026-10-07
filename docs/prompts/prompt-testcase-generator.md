# Documento de Casos de Testes - Sistema McBugs

**Objetivo:** Criar um documento de Casos de Testes para o sistema McBugs

Como um **Analista de Qualidade Sênior**, você deve realizar uma análise completa do sistema **Contaflux** e definir os possíveis cenários de teste que precisam ser validados a nível funcional. O foco está em identificar os fluxos de trabalho essenciais e garantir que todas as funcionalidades críticas sejam cobertas.

**Instruções específicas:**

- **Exclusões:** Não é necessário avaliar aspectos de performance neste momento. Testes de automação não são necessários, o foco é apenas nos testes manuais.
- **Formato:** A documentação dos casos de teste deve ser feita em **Markdown** e salva na pasta **Docs** do projeto.
- **Padrão de Teste:** Siga o modelo tradicional de caso de teste. O objetivo é garantir que os fluxos funcionais estejam claramente descritos e com critérios de aceitação bem definidos.

---

## Modelo de Caso de Teste

Abaixo está o formato para criação de cada **Caso de Teste**. O conteúdo de cada caso de teste deve ser detalhado de forma clara, para que qualquer analista ou desenvolvedor consiga entender o objetivo e os passos do teste.

---

### **CT001 - [Nome do Caso de Teste]**

#### **Objetivo**

Aqui você irá descrever claramente o objetivo deste caso de teste, especificando o que está sendo validado. O objetivo pode ser algo como "Validar que a página de login aceita credenciais válidas" ou "Verificar o comportamento de um usuário tentando realizar uma compra sem saldo suficiente".

#### **Pré-Condições**

Liste todas as condições que precisam ser atendidas antes de iniciar o teste. Isso pode incluir configurações do sistema, dados específicos no banco de dados, ou requisitos sobre a conta do usuário, entre outros.

#### **Passos**

Descreva os passos a serem seguidos para realizar o teste. Cada ação deve ser clara e objetiva.

| **Id** | **Ação**                          | **Resultado Esperado**                            |
|--------|------------------------------------|---------------------------------------------------|
| 1      | Acessar o sistema                  | O sistema deve estar online e disponível para o login. |
| 2      | Inserir usuário e senha válidos    | O usuário é redirecionado para a página inicial após um login bem-sucedido. |
| 3      | Clicar em "Entrar"                 | O sistema realiza a autenticação corretamente e exibe a mensagem de boas-vindas. |

#### **Resultados Esperados**

Aqui, defina os critérios de sucesso para o teste, ou seja, como o sistema deve se comportar ao final do processo descrito. Deixe claro o que deve ser observado para determinar se o teste foi bem-sucedido ou falhou.

#### **Critérios de Aceitação**

Liste os critérios para que o teste seja considerado concluído com sucesso. Esses critérios devem estar alinhados com o objetivo da funcionalidade e os requisitos de negócio.

---

## Exemplo de Caso de Teste

### **CT001 - Testar Login com Credenciais Válidas**

#### **Objetivo**

Validar que o sistema permite o login do usuário com credenciais válidas e direciona o usuário para a página inicial.

#### **Pré-Condições**

- O sistema McBugs deve estar online e acessível.
- O usuário deve ter uma conta ativa com credenciais válidas.
- O navegador deve estar configurado corretamente para acessar o sistema.

#### **Passos**

| **Id** | **Ação**                          | **Resultado Esperado**                            |
|--------|------------------------------------|---------------------------------------------------|
| 1      | Acessar a página de login          | A página de login deve ser carregada corretamente, com campos para inserir usuário e senha. |
| 2      | Inserir o nome de usuário e a senha | O nome de usuário e a senha devem ser inseridos sem erros. |
| 3      | Clicar no botão "Entrar"           | O sistema deve autenticar as credenciais e redirecionar o usuário para a página inicial. |
| 4      | Verificar a mensagem de boas-vindas | O usuário deve ver uma mensagem de boas-vindas, indicando que o login foi bem-sucedido. |

#### **Resultados Esperados**

- O sistema deve validar as credenciais corretamente.
- O usuário deve ser autenticado e redirecionado para a página inicial.

#### **Critérios de Aceitação**

- A página inicial deve ser exibida sem erros após o login.
- Não deve ocorrer nenhum erro de autenticação ou falha de redirecionamento.

---

## Dicas:

1. Considere todos os fluxos possíveis para garantir uma cobertura completa dos testes, incluindo cenários positivos e negativos.
2. Seja detalhado nos passos e nos resultados esperados para evitar ambiguidades.

---