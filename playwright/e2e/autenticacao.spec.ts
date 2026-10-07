import { test, expect, type Browser, type Page } from "@playwright/test";

const usuario = {
  nome: "Analista Teste",
  email: "analista.teste@contaflux.local",
  senha: "Senha@Teste123",
} as const;

/**
 * A rota /auth é renderizada no servidor (SSR); cliques e digitação antes da hidratação do React
 * são perdidos. Aguarda o React anexar seus handlers ao botão "Entrar".
 */
async function aguardarHidratacao(page: Page): Promise<void> {
  const botaoEntrar = page.getByRole("button", { name: "Entrar", exact: true });
  await expect
    .poll(() =>
      botaoEntrar.evaluate((el) => Object.keys(el).some((key) => key.startsWith("__reactProps"))),
    )
    .toBe(true);
}

/**
 * Garante que o usuário de teste exista, cadastrando-o pela aba "Criar conta" num contexto
 * descartável. Se o e-mail já estiver cadastrado, o toast de erro também é aceito.
 */
async function garantirUsuarioCadastrado(browser: Browser): Promise<void> {
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  await page.goto("/auth");
  await aguardarHidratacao(page);
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await page.getByRole("textbox", { name: "Nome completo" }).fill(usuario.nome);
  await page.getByRole("textbox", { name: "E-mail" }).fill(usuario.email);
  await page.getByRole("textbox", { name: "Senha" }).fill(usuario.senha);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();

  await expect(
    page.getByText("Conta criada").or(page.getByText("Não foi possível criar a conta")),
  ).toBeVisible();

  await context.close();
}

test.describe("Autenticação", () => {
  test.beforeAll(async ({ browser }) => {
    await garantirUsuarioCadastrado(browser);
  });

  test("CT001 - Login com credenciais válidas", async ({ page }) => {
    // Passo 1: tela de acesso
    await page.goto("/auth");
    await aguardarHidratacao(page);
    await expect(page.getByRole("heading", { name: "Extratos e classificação" })).toBeVisible();
    await expect(page.getByText("Acesso", { exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Entrar" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Passo 2: preencher credenciais
    const email = page.getByRole("textbox", { name: "E-mail" });
    const senha = page.getByRole("textbox", { name: "Senha" });
    await email.fill(usuario.email);
    await senha.fill(usuario.senha);
    await expect(email).toHaveValue(usuario.email);
    await expect(senha).toHaveValue(usuario.senha);

    // Passo 3: enviar o formulário (botão, não a aba)
    const botaoEntrar = page.getByRole("button", { name: "Entrar", exact: true });
    await expect(botaoEntrar).toBeEnabled();
    await botaoEntrar.click();
    await expect(page).toHaveURL(/\/empresas$/);

    // Passo 4: página de empresas
    await expect(page.getByRole("heading", { name: "Empresas", level: 1 })).toBeVisible();
    await expect(page.getByText("Não foi possível entrar")).toHaveCount(0);

    // A sessão persiste após recarregar
    await page.reload();
    await expect(page).toHaveURL(/\/empresas$/);
    await expect(page.getByRole("heading", { name: "Empresas", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: usuario.email })).toBeVisible();
  });
});
