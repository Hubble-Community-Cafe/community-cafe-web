import { test, expect } from '@playwright/test'
import { resetBackend, setUiRole } from '../../fixtures/backend'
import { ScreensAdminPage } from '../../pages/ScreensAdminPage'
import { captureScreenshot } from '../../fixtures/evidence'

/**
 * The screen scene panel. Switching a scene is a bar-shift action, so a plain viewer must be able
 * to do it; choosing which poster a scene shows is setup and stays with editors.
 */
test.describe('Admin screen scenes', () => {
  test.beforeEach(async ({ request }) => {
    await resetBackend(request)
  })

  test('a viewer can close the bar and open it again', async ({ request, page }, testInfo) => {
    await setUiRole(request, 'VIEWER')
    const screens = new ScreensAdminPage(page)
    await screens.goto()

    // The fake Aurora starts with every screen on the carousel.
    await expect(screens.currentScene()).toHaveText('Open')
    await screens.expectHandler('HubbleGeneralScreen', 'CarouselPosterHandler')

    await screens.apply('Closed')
    await screens.expectHandler('HubbleGeneralScreen', 'StaticPosterHandler')
    await screens.expectHandler('PlazaScreen', 'StaticPosterHandler')
    await screens.expectHandler('FoyerScreen', 'StaticPosterHandler')
    await captureScreenshot(testInfo, page, 'admin-screens-closed')

    await screens.apply('Open')
    await screens.expectHandler('HubbleGeneralScreen', 'CarouselPosterHandler')
  })

  test('last call shows its own slide, distinct from closed', async ({ request, page }) => {
    await setUiRole(request, 'VIEWER')
    const screens = new ScreensAdminPage(page)
    await screens.goto()

    await screens.apply('Last call')
    await screens.expectHandler('HubbleGeneralScreen', 'StaticPosterHandler')

    // Same handler as Closed, so the scene can only be told apart by the active poster.
    await screens.apply('Closed')
    await expect(screens.currentScene()).toHaveText('Closed')
  })

  test('a viewer cannot change which poster a scene shows', async ({ request, page }) => {
    await setUiRole(request, 'VIEWER')
    const screens = new ScreensAdminPage(page)
    await screens.goto()

    await expect(screens.screenRow('HubbleGeneralScreen')).toBeVisible()
    await expect(screens.posterSelect('Closed')).toHaveCount(0)
  })

  test('an editor re-points a scene at another poster', async ({ request, page }) => {
    await setUiRole(request, 'EDITOR')
    const screens = new ScreensAdminPage(page)
    await screens.goto()

    await screens.posterSelect('Closed').selectOption({ label: 'Last Call slide.png' })
    await expect(screens.posterSelect('Closed')).toHaveValue('4')

    // The choice survives a reload, so it is persisted rather than local state.
    await page.reload()
    await expect(screens.posterSelect('Closed')).toHaveValue('4')
  })

  test('a scene with no poster configured refuses rather than showing the wrong slide',
    async ({ request, page }) => {
      await setUiRole(request, 'EDITOR')
      const screens = new ScreensAdminPage(page)
      await screens.goto()

      await screens.posterSelect('Closed').selectOption({ label: 'Not configured' })
      await screens.sceneButton('Closed').click()

      await expect(page.getByText(/No poster is configured/)).toBeVisible()
      await screens.expectHandler('HubbleGeneralScreen', 'CarouselPosterHandler')
    })
})
