import {Page} from "@playwright/test";

export class HivePage {
    readonly
    constructor(private page: Page) {}

    async visit() {
        await this.page.goto('/hives');
    }

    async createHive() {
        await this.page.click('text=Add Hive');
        await this.page.click('text=Save');
    }

    async getHives() {
        return await this.page.locator('text=Hive').count();
    }
}