import { test, expect } from '@playwright/test';

test.describe('Flujo E2E - Módulo Inicial', () => {
  test('Debe cargar el Dashboard/Home y tomar captura', async ({ page }) => {
    // 1. Navegar a la ruta principal local (asegúrate de que Vite esté corriendo en este puerto)
    await page.goto('http://localhost:5173/');

    // 2. Esperar a que la página cargue (validamos que el layout principal esté visible)
    // Buscamos un elemento clave del Sidebar o Topbar, o simplemente el contenedor principal.
    await page.waitForLoadState('networkidle');

    // 3. Tomar una captura de pantalla del módulo inicial para el reporte
    await page.screenshot({ path: 'capturas/dashboard-inicial.png', fullPage: true });

    // 4. Verificaciones básicas (ajusta el texto según lo que diga tu HomePage)
    // Ejemplo: Verificar que no estemos en una página de error
    const paginaError = page.locator('text="Página no encontrada"');
    await expect(paginaError).not.toBeVisible();
  });
});