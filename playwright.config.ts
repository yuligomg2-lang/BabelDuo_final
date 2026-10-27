import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";

/**
 * Conexión con el Backend:
 * Busca el archivo ".env" dentro de la carpeta del servidor para que Playwright
 * conozca las credenciales de tu base de datos de MongoDB Atlas.
 */
dotenv.config({ path: path.resolve(__dirname, "backend", ".env") });

export default defineConfig({
  // Carpeta donde Playwright buscará  archivos de prueba (ej. login.spec.ts)
  testDir: "./tests",

  // Ejecuta las pruebas en paralelo para ahorrar tiempo
  fullyParallel: true,

  //Control de descuidos: Bloquea subidas accidentales a producción si se dejo activada la etiqueta 'test.only'
  forbidOnly: !!process.env.CI,

  // Reintenta los tests caídos únicamente si se estan ejecutándo en la nube (CI)
  retries: process.env.CI ? 2 : 0,

  // Desactiva el paralelismo en la nube para evitar sobrecargar los servidores virtuales
  workers: process.env.CI ? 1 : undefined,

  timeout: 180000,

  // Crea un reporte visual en HTML al finalizar las pruebas
  reporter: "html",

  // Configuración compartida para todos los navegadores
  use: {
    // La URL base que usará comandos como `await page.goto('/')` (Apunta a Vite de React)
    baseURL: "http://localhost:5173",

    // Graba capturas y videos paso a paso de los errores (ideal para debuggear)
    trace: "on",

    //Graba un video real en alta definición de cada test
    video: "on",
  },

  // Servidor web automático controlado por Playwright
  webServer: {
    // Llama al comando unificado que configuramos con 'concurrently' en la raíz
    command: "npm run app",

    // Espera a que la URL de React responda antes de lanzar los tests en el navegador
    url: "http://localhost:5173",

    // Si ya encendiste la app manualmente en tu terminal, la reutiliza en lugar de fallar
    reuseExistingServer: !process.env.CI,

    // Le da 2 minutos de margen al servidor para encenderse y conectar con MongoDB Atlas
    timeout: 120000,
  },

  // Navegadores reales en los que Playwright probará el frontend de React
  projects: [
    {
      name: "chromium", // Google Chrome / Edge
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
