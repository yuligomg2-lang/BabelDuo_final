import { test, expect } from "@playwright/test";

test.describe("Pruebas de caja negra - Mensajería Babel Dúo", () => {
  test("BB-GMT-01 a BB-GMT-12 - Validaciones del campo de mensaje", async ({
    browser,
  }) => {
    // ============================================================
    // CONFIGURACIÓN DE DOS USUARIOS
    // ============================================================

    const contextA = await browser.newContext({
      recordVideo: {
        dir: "test-results/videos/",
      },
    });

    const contextB = await browser.newContext({
      recordVideo: {
        dir: "test-results/videos/",
      },
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

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

    // ============================================================
    // LOGIN USUARIO A
    // ============================================================

    console.log("🔐 LOGIN USUARIO A");

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

    await pageA.waitForTimeout(1500);

    console.log("✅ Usuario A autenticado");

    // ============================================================
    // LOGIN USUARIO B
    // ============================================================

    console.log("🔐 LOGIN USUARIO B");

    await pageB.goto("/");

    await pageB
      .getByPlaceholder("Email address")
      .fill("juliet.test@example.com");

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

    await pageB.waitForTimeout(1500);

    console.log("✅ Usuario B autenticado");

    // ============================================================
    // ENTRAR A LA MISMA SALA
    // ============================================================

    console.log("🏠 ENTRANDO A PRIMERA SALA");

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

    console.log("✅ Ambos usuarios están en Primera sala");

    // ============================================================
    // ELEMENTOS DEL CHAT
    // ============================================================

    const inputA = pageA.getByPlaceholder("Escribe un mensaje...");

    const enviarA = pageA.getByRole("button", {
      name: "Enviar mensaje",
    });

    await expect(inputA).toBeVisible({
      timeout: 10000,
    });

    await expect(enviarA).toBeVisible({
      timeout: 10000,
    });

    // ============================================================
    // VERIFICAR MAXLENGTH
    // ============================================================

    await expect(inputA).toHaveAttribute("maxlength", "100");

    console.log("✅ Campo configurado con máximo 100 caracteres");

    // ============================================================
    // BB-GMT-01
    // CAMPO VACÍO
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-01 - Campo vacío");

    await inputA.fill("");

    await expect(enviarA).toBeDisabled();

    console.log("✅ BB-GMT-01 APROBADO");

    // ============================================================
    // BB-GMT-02
    // SOLO ESPACIOS
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-02 - Solo espacios");

    await inputA.fill("     ");

    await expect(enviarA).toBeDisabled();

    console.log("✅ BB-GMT-02 APROBADO");

    // ============================================================
    // BB-GMT-03
    // TEXTO NORMAL
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-03 - Texto normal");

    const mensajeNormal =
      "Este es un mensaje normal para comprobar el funcionamiento del chat.";

    await inputA.fill(mensajeNormal);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensajeNormal, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-03 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-04
    // TILDES Y Ñ
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-04 - Tildes y ñ");

    const mensajeTildes = "Árbol, canción, información, niño, español.";

    await inputA.fill(mensajeTildes);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensajeTildes, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-04 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-05
    // EMOJIS Y UNICODE
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-05 - Emojis y Unicode");

    const mensajeUnicode = "Hola 👋 😊 🚀 ❤️ 🌎 ¡Probando Unicode!";

    await inputA.fill(mensajeUnicode);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensajeUnicode, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-05 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-06
    // CARACTERES ESPECIALES
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-06 - Caracteres especiales");

    const mensajeEspecial = `Texto especial: < > & " ' / \\ @ # $ %`;

    await inputA.fill(mensajeEspecial);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensajeEspecial, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-06 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-07
    // UN SOLO CARÁCTER
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-07 - Un carácter");

    const mensajeUnCaracter = "A";

    await inputA.fill(mensajeUnCaracter);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensajeUnCaracter, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-07 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-08
    // 99 CARACTERES = N-1
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-08 - 99 caracteres");

    const mensaje99 = "A".repeat(99);

    await inputA.fill(mensaje99);

    const valor99 = await inputA.inputValue();

    expect(valor99.length).toBe(99);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensaje99, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-08 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-09
    // 100 CARACTERES = N
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-09 - 100 caracteres");

    const mensaje100 = "B".repeat(100);

    await inputA.fill(mensaje100);

    const valor100 = await inputA.inputValue();

    expect(valor100.length).toBe(100);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    await expect(
      pageB.getByText(mensaje100, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-09 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-10
    // 101 CARACTERES = N+1
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-10 - 101 caracteres");

    const mensaje101 = "C".repeat(101);

    await inputA.fill(mensaje101);

    const valor101 = await inputA.inputValue();

    console.log("Caracteres solicitados:", mensaje101.length);

    console.log("Caracteres aceptados:", valor101.length);

    // El maxlength=100 debe impedir el carácter 101.
    expect(valor101.length).toBe(100);

    await expect(enviarA).toBeEnabled();

    // Enviar los 100 caracteres realmente aceptados.
    await enviarA.click();

    const mensajeAceptado = "C".repeat(100);

    await expect(
      pageB.getByText(mensajeAceptado, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-10 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-11
    // ENTER PARA ENVIAR
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-11 - Tecla Enter");

    const mensajeEnter = "Mensaje enviado mediante la tecla Enter";

    await inputA.fill(mensajeEnter);

    await expect(enviarA).toBeEnabled();

    await inputA.press("Enter");

    await expect(
      pageB.getByText(mensajeEnter, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    console.log("✅ BB-GMT-11 APROBADO");

    await pageA.waitForTimeout(500);

    // ============================================================
    // BB-GMT-12
    // PRUEBA XSS
    // ============================================================

    console.log("");
    console.log("🧪 BB-GMT-12 - Seguridad XSS");

    const mensajeXSS = "<script>alert('XSS')</script>";

    let xssEjecutado = false;

    pageB.on("dialog", async (dialog) => {
      xssEjecutado = true;

      console.log("🚨 ALERTA XSS DETECTADA:", dialog.message());

      await dialog.dismiss();
    });

    await inputA.fill(mensajeXSS);

    await expect(enviarA).toBeEnabled();

    await enviarA.click();

    // Debe aparecer como texto.
    await expect(
      pageB.getByText(mensajeXSS, {
        exact: true,
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Debe NO ejecutar JavaScript.
    expect(xssEjecutado).toBe(false);

    console.log("✅ BB-GMT-12 APROBADO");

    // ============================================================
    // RESULTADO FINAL
    // ============================================================

    console.log("");
    console.log("==============================================");
    console.log("     PRUEBAS DE CAJA NEGRA COMPLETADAS");
    console.log("==============================================");
    console.log("BB-GMT-01  Campo vacío          ✅");
    console.log("BB-GMT-02  Solo espacios        ✅");
    console.log("BB-GMT-03  Texto normal         ✅");
    console.log("BB-GMT-04  Tildes y ñ           ✅");
    console.log("BB-GMT-05  Unicode y emojis     ✅");
    console.log("BB-GMT-06  Caracteres especiales✅");
    console.log("BB-GMT-07  1 carácter           ✅");
    console.log("BB-GMT-08  99 caracteres        ✅");
    console.log("BB-GMT-09  100 caracteres       ✅");
    console.log("BB-GMT-10  101 caracteres       ✅ BLOQUEADO");
    console.log("BB-GMT-11  Enter                ✅");
    console.log("BB-GMT-12  XSS                  ✅");
    console.log("==============================================");

    // Mantener la pantalla unos segundos
    // para que el resultado se vea en el video.
    await pageA.waitForTimeout(3000);

    // ============================================================
    // CERRAR CONTEXTOS
    // ============================================================

    await contextA.close();
    await contextB.close();
  });
});
