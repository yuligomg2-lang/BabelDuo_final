import { test, expect } from "@playwright/test";

test("Debería permitir una conversación entre dos usuarios en tiempo real", async ({
  browser,
}) => {
  // 🎥 Forzar grabación de video para el Usuario A
  const contextA = await browser.newContext({
    recordVideo: {
      dir: "test-results/videos/",
    },
  });

  // 🎥 Forzar grabación de video para el Usuario B
  const contextB = await browser.newContext({
    recordVideo: {
      dir: "test-results/videos/",
    },
  });

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // ==========================================
  // CONSOLA Y ERRORES
  // ==========================================

  pageA.on("console", (msg) => {
    console.log(`[USUARIO A] ${msg.type()}: ${msg.text()}`);
  });

  pageB.on("console", (msg) => {
    console.log(`[USUARIO B] ${msg.type()}: ${msg.text()}`);
  });

  pageA.on("pageerror", (error) => {
    console.log("[ERROR USUARIO A]", error.message);
  });

  pageB.on("pageerror", (error) => {
    console.log("[ERROR USUARIO B]", error.message);
  });

  // ==========================================
  // LOGIN USUARIO A
  // ==========================================

  console.log("👤 Iniciando sesión como Usuario A...");

  await pageA.goto("/");

  await pageA.getByPlaceholder("Email address").fill("admin123@gmail.com");

  await pageA.getByPlaceholder("Password").fill("Zxcbnm123");

  await pageA
    .getByRole("button", {
      name: "Login",
      exact: true,
    })
    .click();

  await expect(pageA).toHaveURL(/\/chat$/, {
    timeout: 10000,
  });

  console.log("✅ Usuario A inició sesión correctamente");

  await pageA.waitForTimeout(1500);

  // ==========================================
  // LOGIN USUARIO B
  // ==========================================

  console.log("👤 Iniciando sesión como Usuario B...");

  await pageB.goto("/");

  await pageB.getByPlaceholder("Email address").fill("juliet.test@example.com");

  await pageB.getByPlaceholder("Password").fill("Segura1234!");

  await pageB
    .getByRole("button", {
      name: "Login",
      exact: true,
    })
    .click();

  await expect(pageB).toHaveURL(/\/chat$/, {
    timeout: 10000,
  });

  console.log("✅ Usuario B inició sesión correctamente");

  await pageB.waitForTimeout(1500);

  // ==========================================
  // SELECCIONAR SALA
  // ==========================================

  console.log("🏠 Seleccionando la misma sala...");

  const salaA = pageA.getByRole("button", {
    name: /Primera sala/,
  });

  const salaB = pageB.getByRole("button", {
    name: /Primera sala/,
  });

  await expect(salaA).toBeVisible({
    timeout: 10000,
  });

  await expect(salaB).toBeVisible({
    timeout: 10000,
  });

  await salaA.click();

  await pageA.waitForTimeout(1000);

  await salaB.click();

  await pageB.waitForTimeout(1500);

  console.log("✅ Ambos usuarios están en la misma sala");

  // ==========================================
  // INPUTS
  // ==========================================

  const inputA = pageA.getByPlaceholder("Escribe un mensaje...");

  const inputB = pageB.getByPlaceholder("Escribe un mensaje...");

  await expect(inputA).toBeVisible();

  await expect(inputB).toBeVisible();

  // ==========================================
  // MENSAJE 1 - A → B
  // ==========================================

  const mensaje1 = "Hola, ¿cómo estás? Estoy probando el chat en tiempo real.";

  console.log("✍️ Usuario A está escribiendo...");

  const escrituraA1 = inputA.pressSequentially(mensaje1, {
    delay: 70,
  });

  await expect(pageB.getByText(/está escribiendo\.\.\./)).toBeVisible({
    timeout: 5000,
  });

  console.log("✅ Usuario B detectó que A está escribiendo");

  await escrituraA1;

  await pageA
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  await expect(
    pageB.getByText(mensaje1, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10000,
  });

  console.log("📩 Usuario B recibió el mensaje 1");

  await pageB.waitForTimeout(800);

  // ==========================================
  // MENSAJE 2 - B → A
  // ==========================================

  const mensaje2 = "¡Hola! Estoy muy bien, gracias. ¿Y tú?";

  console.log("✍️ Usuario B está escribiendo...");

  const escrituraB1 = inputB.pressSequentially(mensaje2, {
    delay: 70,
  });

  await expect(pageA.getByText(/está escribiendo\.\.\./)).toBeVisible({
    timeout: 5000,
  });

  console.log("✅ Usuario A detectó que B está escribiendo");

  await escrituraB1;

  await pageB
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  await expect(
    pageA.getByText(mensaje2, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10000,
  });

  console.log("📩 Usuario A recibió el mensaje 2");

  await pageA.waitForTimeout(800);

  // ==========================================
  // MENSAJE 3 - A → B
  // ==========================================

  const mensaje3 =
    "También estoy muy bien, gracias. El chat funciona correctamente.";

  console.log("✍️ Usuario A está escribiendo...");

  const escrituraA2 = inputA.pressSequentially(mensaje3, {
    delay: 70,
  });

  await expect(pageB.getByText(/está escribiendo\.\.\./)).toBeVisible({
    timeout: 5000,
  });

  await escrituraA2;

  await pageA
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  await expect(
    pageB.getByText(mensaje3, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10000,
  });

  console.log("📩 Usuario B recibió el mensaje 3");

  await pageB.waitForTimeout(800);

  // ==========================================
  // MENSAJE 4 - B → A
  // ==========================================

  const mensaje4 =
    "Qué bueno saberlo. Estoy comprobando la comunicación en tiempo real.";

  console.log("✍️ Usuario B está escribiendo...");

  const escrituraB2 = inputB.pressSequentially(mensaje4, {
    delay: 70,
  });

  await expect(pageA.getByText(/está escribiendo\.\.\./)).toBeVisible({
    timeout: 5000,
  });

  await escrituraB2;

  await pageB
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  await expect(
    pageA.getByText(mensaje4, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10000,
  });

  console.log("📩 Usuario A recibió el mensaje 4");

  await pageA.waitForTimeout(800);

  // ==========================================
  // MENSAJE 5 - A → B
  // ==========================================

  const mensaje5 = "Perfecto. Los mensajes están llegando correctamente.";

  console.log("✍️ Usuario A está escribiendo...");

  const escrituraA3 = inputA.pressSequentially(mensaje5, {
    delay: 70,
  });

  await expect(pageB.getByText(/está escribiendo\.\.\./)).toBeVisible({
    timeout: 5000,
  });

  await escrituraA3;

  await pageA
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  await expect(
    pageB.getByText(mensaje5, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10000,
  });

  console.log("📩 Usuario B recibió el mensaje 5");

  await pageB.waitForTimeout(800);

  // ==========================================
  // MENSAJE 6 - B → A
  // ==========================================

  const mensaje6 = "¡Excelente! Socket.io está funcionando correctamente.";

  console.log("✍️ Usuario B está escribiendo...");

  const escrituraB3 = inputB.pressSequentially(mensaje6, {
    delay: 70,
  });

  await expect(pageA.getByText(/está escribiendo\.\.\./)).toBeVisible({
    timeout: 5000,
  });

  await escrituraB3;

  await pageB
    .getByRole("button", {
      name: "Enviar mensaje",
    })
    .click();

  await expect(
    pageA.getByText(mensaje6, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 10000,
  });

  console.log("📩 Usuario A recibió el mensaje 6");

  // ==========================================
  // RESULTADO FINAL
  // ==========================================

  console.log("");
  console.log("========================================");
  console.log("✅ PRUEBA DE CHAT EN TIEMPO REAL EXITOSA");
  console.log("========================================");
  console.log("✅ Usuario A inició sesión");
  console.log("✅ Usuario B inició sesión");
  console.log("✅ Ambos usuarios accedieron a la misma sala");
  console.log("✅ Indicador de escritura A → B");
  console.log("✅ Indicador de escritura B → A");
  console.log("✅ Mensajes enviados A → B");
  console.log("✅ Mensajes enviados B → A");
  console.log("✅ Comunicación bidireccional mediante Socket.io");
  console.log("========================================");

  // Mantener las ventanas unos segundos para la evidencia
  await pageA.waitForTimeout(3000);
  await pageB.waitForTimeout(3000);

  await contextA.close();
  await contextB.close();
});
