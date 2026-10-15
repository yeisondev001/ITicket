import { expect, test, type Page } from '@playwright/test'

// Recorre el login y el módulo de tickets con los datos de prueba,
// verifica lo esencial de cada pantalla y guarda capturas para el informe.
const CAPTURAS = 'capturas/avance-2'

const TECNICO = { id: 'mock-tecnico-1', nombre: 'Starlyn', rol: 'tecnico' }

// Abre la app con la sesión del técnico ya iniciada (sin pasar por el login).
async function conSesionDeTecnico(page: Page) {
  await page.addInitScript((usuario) => {
    sessionStorage.setItem('iticket.sesion', JSON.stringify(usuario))
  }, TECNICO)
}

test.describe('Login y módulo de tickets', () => {
  // Las capturas se toman una sola vez, con Chromium.
  test.skip(({ browserName }) => browserName !== 'chromium', 'Solo en Chromium')
  test.use({ viewport: { width: 1440, height: 900 } })

  test('inicio', async ({ page }) => {
    await conSesionDeTecnico(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Starlyn')
    await page.screenshot({ path: `${CAPTURAS}/00-inicio.png`, fullPage: true })
  })

  test('login: valida los campos y muestra un mensaje claro si fallan las credenciales', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/01-login.png` })

    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByText('Escribe tu correo.')).toBeVisible()
    await expect(page.getByText('Escribe tu contraseña.')).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/02-login-validacion.png` })

    await page.getByLabel('Correo').fill('tecnico@iticket.dev')
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.')
  })

  test('login: redirige según el rol y permite cerrar sesión', async ({ page }) => {
    const entrar = async (correo: string) => {
      await page.goto('/login')
      await page.getByLabel('Correo').fill(correo)
      await page.getByLabel('Contraseña', { exact: true }).fill('iticket123')
      await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    }
    const salir = async () => {
      await page.getByRole('button', { name: 'Cerrar sesión' }).click()
      await expect(page).toHaveURL('/login')
    }

    await entrar('tecnico@iticket.dev')
    await expect(page).toHaveURL('/mis-tickets')
    await expect(page.getByRole('heading', { name: 'Tu cola de trabajo' })).toBeVisible()
    await salir()

    await entrar('supervisor@iticket.dev')
    await expect(page).toHaveURL('/tickets')
    await salir()

    await entrar('usuario@iticket.dev')
    await expect(page).toHaveURL('/mis-tickets')
    await expect(page.getByRole('heading', { name: 'Mis tickets', level: 1 })).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/03-mis-tickets-usuario.png`, fullPage: true })
    await salir()

    // Sin sesión, las páginas internas mandan al login.
    await page.goto('/tickets')
    await expect(page).toHaveURL('/login')
  })

  test('lista de tickets: vistas y búsqueda', async ({ page }) => {
    await conSesionDeTecnico(page)
    await page.goto('/tickets')
    await expect(page.getByRole('heading', { name: 'Tickets', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'TCK-1042' })).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/04-lista-tickets.png`, fullPage: true })

    await page.getByRole('tab', { name: /SLA en riesgo/ }).click()
    await expect(page.getByRole('link', { name: 'TCK-1039' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'TCK-1041' })).toHaveCount(0)

    await page.getByRole('tab', { name: /Todos/ }).click()
    await page.getByLabel('Buscar tickets por ID o título').fill('impresora')
    await expect(page.getByRole('link', { name: 'TCK-1040' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'TCK-1042' })).toHaveCount(0)
  })

  test('nuevo ticket: valida y confirma con el número de ticket', async ({ page }) => {
    await conSesionDeTecnico(page)
    await page.goto('/tickets/nuevo')
    await page.getByRole('button', { name: 'Crear ticket' }).click()
    await expect(page.getByText('Escribe un título de al menos 3 caracteres.')).toBeVisible()
    await expect(page.getByText('Cuéntanos qué está pasando.')).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/05-nuevo-ticket-validacion.png`, fullPage: true })

    await page.getByLabel('Título').fill('No funciona el correo en Finanzas')
    await page.getByLabel('Descripción').fill('Desde las 9:00 nadie en Finanzas puede enviar correos.')
    await page.getByLabel('Servicio afectado').selectOption({ label: 'Correo electrónico (crítico)' })
    await page.getByRole('button', { name: 'Crear ticket' }).click()
    await expect(page.getByRole('heading', { name: /Ticket TCK-\d+ creado/ })).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/06-nuevo-ticket-confirmacion.png`, fullPage: true })
  })

  test('detalle del ticket: agrega un comentario', async ({ page }) => {
    await conSesionDeTecnico(page)
    await page.goto('/tickets/1042')
    await expect(page.getByRole('heading', { name: 'Servidor de correo no responde' })).toBeVisible()
    await page.getByLabel('Agregar comentario').fill('Servicio reiniciado, monitoreando.')
    await page.getByRole('button', { name: 'Comentar' }).click()
    await expect(page.getByText('Servicio reiniciado, monitoreando.')).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/07-detalle-ticket.png`, fullPage: true })
  })

  test('panel del técnico: toma un ticket sin asignar', async ({ page }) => {
    await conSesionDeTecnico(page)
    await page.goto('/mis-tickets')
    await expect(page.getByRole('heading', { name: 'Tu cola de trabajo' })).toBeVisible()
    await page.getByRole('button', { name: 'Tomar TCK-1040' }).click()
    await expect(page.getByRole('button', { name: 'Tomar TCK-1040' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Impresora del segundo piso no imprime' })).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/08-panel-tecnico.png`, fullPage: true })
  })

  test('celular: el menú lateral se abre como panel', async ({ page }) => {
    await conSesionDeTecnico(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/tickets')
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.screenshot({ path: `${CAPTURAS}/09-celular-menu.png` })
  })
})
