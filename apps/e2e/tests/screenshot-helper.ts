// screenshot-helper.js
import {Page, PageScreenshotOptions} from "@playwright/test";

const fs = require('fs');
const path = require('path');

/**
 * A screenshot helper for Playwright Test with multi-project configuration
 * @param {object} options Configuration options
 * @param {string} options.projectName The name of your main project/application
 * @param {string} options.outputDir Directory to save screenshots (default: 'screenshots')
 * @returns {Function} The screenshot taking function
 */
export function createScreenshotHelper({ projectName, outputDir = 'screenshots' }) {
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    /**
     * Take a screenshot with proper naming based on project/browser
     * @param {import('@playwright/test').Page} page Playwright page object
     * @param {string} name Name of the screenshot (e.g., 'homepage', 'login_form')
     * @param {object} options Additional Playwright screenshot options
     * @returns {Promise<string>} Path to the saved screenshot
     */
    return async function takeScreenshot(page: Page, name: string, options: PageScreenshotOptions = {}): Promise<string> {
        // Get the project name from the browser's context
        const browserName = page.context().browser().browserType().name();

        // Determine if it's mobile based on viewport size
        const viewport = page.viewportSize();
        const isMobile = viewport && viewport.width < 768;
        const deviceType = isMobile ? 'mobile' : 'desktop';

        // Get the project name from the test info if available
        // Create filename with pattern: project_name_browsername_devicetype_screenshotname.png
        const filename = `${projectName}_${browserName}_${deviceType}_${name}.png`;
        const fullPath = path.join(outputDir, filename);

        await page.screenshot({
            path: fullPath,
            fullPage: options.fullPage !== undefined ? options.fullPage : true,
            ...options
        });

        console.log(`Screenshot saved: ${fullPath}`);
        return fullPath;
    };
}