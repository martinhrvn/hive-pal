import {  Page } from '@playwright/test';
import { TEST_SELECTORS } from '../utils';
import { FeedingsSectionPageObject } from './feeding-section.page';
import { TreatmentSectionPageObject } from './treatment-section.page';
import { FramesSectionPageObject } from './frames-section.page';

export class ActionsSectionPageObject {
  readonly page: Page;
  readonly feedingSection: FeedingsSectionPageObject;
  readonly treatmentSection: TreatmentSectionPageObject;
  readonly framesSection: FramesSectionPageObject;

  constructor(page: Page) {
    this.page = page;
    this.feedingSection = new FeedingsSectionPageObject(page);
    this.treatmentSection = new TreatmentSectionPageObject(page);
    this.framesSection = new FramesSectionPageObject(page);
  }

  selectAction(action: string) {
    return this.getAction(action).click();
  }

  getAction(action: string) {
    return this.page
      .getByTestId(TEST_SELECTORS.ACTION_BUTTONS)
      .getByText(action);
  }

  async setupComponent() {
    return new ActionsSectionPageObject(this.page);
  }
}