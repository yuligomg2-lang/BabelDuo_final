import { test, expect } from "@playwright/test";

test("Debería registrar un nuevo usuario exitosamente usando el formulario", async ({
  page,
}) => {
  // 1. Va directo a la URL de registro sin pasar por el login
  await page.goto("/register");

  // 2. Rellena los campos usando los placeholders exactos
  await page.getByPlaceholder("Your name or username").fill("Juliet de Prueba");

  // Creamos un correo único usando la hora actual para evitar duplicados en Atlas
  const correoUnico = `juliet.test@example.com`;
  await page.getByPlaceholder("Email address").fill(correoUnico);

  await page.getByPlaceholder("Password").fill("Segura1234!");

  // 3. Envía el formulario haciendo clic en el botón "Register"
  await page.getByRole("button", { name: "Register", exact: true }).click();

  // 4. Espera a que el backend en Express responda y MongoDB guarde los datos
  // Buscamos el contenedor verde de éxito programado con la clase 'bg-green-50'
  const contenedorExito = page.locator("div.bg-green-50");

  // Le damos un margen de 10 segundos por si la conexión a Atlas tarda un poco
  await expect(contenedorExito).toBeVisible({ timeout: 10000 });
});
