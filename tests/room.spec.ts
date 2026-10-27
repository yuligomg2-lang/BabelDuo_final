import { test, expect } from "@playwright/test";

test("Debería permitir unirse a una sala y enviar un mensaje", async ({
  page,
}) => {
  // 1. Ir al login
  await page.goto("/");

  // 2. Iniciar sesión
  await page.getByPlaceholder("Email address").fill("juliet.test@example.com");
  await page.getByPlaceholder("Password").fill("Segura1234!");

  // 3. Hacer clic en Login
  await page
    .getByRole("button", {
      name: "Login",
      exact: true,
    })
    .click();

  // 4. Verificar que el usuario llegó al chat
  await expect(page).toHaveURL("http://localhost:5173/chat", {
    timeout: 7000,
  });

  // 5. Abrir la opción para unirse a una sala
  await page.getByTitle("Ingresar código de invitación").click();

  // 6. Verificar que apareció el modal
  await expect(
    page.getByRole("heading", { name: "Unirse a una Sala" }),
  ).toBeVisible();

  // 7. Introducir el código de invitación
  await page.getByPlaceholder("Ej: AB12CD").fill("57KC7D");

  // 8. Unirse
  await page.getByRole("button", { name: "Unirse ahora" }).click();

  // 9. Esperar a que termine la operación
  await expect(
    page.getByRole("heading", { name: "Unirse a una Sala" }),
  ).not.toBeVisible();

  // 10. Verificar que la sala aparece en la lista
  const sala = page.getByRole("button", {
    name: /Primera sala/,
  });

  await expect(sala).toBeVisible();

  // 11. Abrir la sala
  await sala.click();

  // 12. Escribir mensaje
  const mensaje = "Hola, este es un mensaje de prueba";

  await page.getByPlaceholder("Escribe un mensaje...").fill(mensaje);

  // 13. Enviar mensaje
  await page
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  // 14. Verificar que el mensaje aparece
  await expect(page.getByText(mensaje, { exact: true })).toBeVisible();
});
