import { test, expect } from "@playwright/test";

test("Debería iniciar sesión exitosamente y redirigir al chat", async ({
  page,
}) => {
  // 1. Abre la página principal (donde carga el Login por defecto)
  await page.goto("/");

  // 2. Rellena los campos usando los placeholders exactos
  await page.getByPlaceholder("Email address").fill("juliet.test@example.com");
  await page.getByPlaceholder("Password").fill("Segura1234!");

  // 3. Hace clic en el botón principal que dice "Login"
  await page.getByRole("button", { name: "Login", exact: true }).click();

  // 4. Verificación definitiva:
  // Playwright esperará a que el backend valide los datos en Atlas y React redirija a la ruta /chat
  await expect(page).toHaveURL("http://localhost:5173/chat", { timeout: 7000 });
});
