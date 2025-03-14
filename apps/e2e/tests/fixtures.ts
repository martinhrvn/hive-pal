import { test as base } from '@playwright/test'

type Fixtures = {
    registeredUser: () => Promise<void>
}
