import { expect, test, type Page } from '@playwright/test';

const mockUrl = '/?fixture=emei-shan-rain';

async function setThresholds(page: Page, amount: string, probability: string) {
  for (const [selector, value] of [
    ['#amountThresholdSlider', amount],
    ['#probThresholdSlider', probability],
  ] as const) {
    await page.locator(selector).evaluate((element: HTMLInputElement, nextValue) => {
      element.value = nextValue;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }
}

test.describe('CloudCtrl · Emei Shan regenfixture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(mockUrl);
    await expect(page.locator('body')).toHaveAttribute('data-weather-source', 'mock');
    await expect(page.locator('#location')).toContainText('Mount Emei');
    await expect(page.locator('#statusText')).toContainText(/Mock actief|Mock active/i);
  });

  test('laadt reproduceerbare Emei Shan-regendata zonder live weer-API', async ({ page }) => {
    const fixture = await page.evaluate(() => (window as any).__CLOUDCTRL_TEST_DATA__.fixture);
    expect(fixture.id).toBe('emei-shan-rain');
    expect(fixture.location.elevation).toBe(3058);
    expect(Math.max(...fixture.hourly.precipitation_probability)).toBe(100);
    expect(fixture.hourly.precipitation).toContain(4.6);
  });

  test('gebruikt >= voor een datapunt exact op de hoeveelheidsdrempel', async ({ page }) => {
    await setThresholds(page, '0.10', '25');

    const result = await page.evaluate(() => {
      const chart = (window as any).__CLOUDCTRL_CHART__;
      return {
        firstAmount: chart.data.datasets[0].data[0],
        summary: document.querySelector('#forecastSummary')?.textContent ?? '',
      };
    });

    expect(result.firstAmount).toBe(0.1);
    expect(result.summary.toLowerCase()).not.toContain('dry');
    expect(result.summary.toLowerCase()).not.toContain('droog');
  });

  test('toont bij 1.00 mm/u en 100% alleen de zware fixturepunten', async ({ page }) => {
    await setThresholds(page, '1.00', '100');

    const visibleAmounts = await page.evaluate(() => {
      const chart = (window as any).__CLOUDCTRL_CHART__;
      return chart.data.datasets[0].data.filter((value: number) => value > 0);
    });

    expect(visibleAmounts.length).toBeGreaterThan(0);
    expect(visibleAmounts.every((value: number) => value >= 1)).toBe(true);
  });

  test('wisselt zichtbaar tussen Detail (6u) en Overzicht (24u)', async ({ page }) => {
    const chartMaximum = () => page.evaluate(() => {
      const chart = (window as any).__CLOUDCTRL_CHART__;
      return Math.max(...chart.data.datasets[0].data);
    });

    await expect(page.locator('#btnDetail')).toHaveClass(/bg-cyan-600/);
    await expect.poll(chartMaximum).toBe(1.2);

    await page.locator('#btnOverview').click();
    await expect(page.locator('#btnOverview')).toHaveClass(/bg-cyan-600/);
    await expect(page.locator('#btnDetail')).not.toHaveClass(/bg-cyan-600/);
    await expect.poll(chartMaximum).toBe(4.6);

    await page.locator('#btnDetail').click();
    await expect(page.locator('#btnDetail')).toHaveClass(/bg-cyan-600/);
    await expect.poll(chartMaximum).toBe(1.2);
  });
});
