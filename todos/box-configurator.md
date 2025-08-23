# Box Configurator Implementation

## Overview
Implement a visual box configurator for beehives that allows users to:
- Add/remove/reorder hive boxes (supers)
- Configure box properties (color, frame count, type, variant)
- Add queen excluders between boxes
- Visualize the hive stack with proper aspect ratios for deep/shallow boxes

## Tasks

### 1. Data Model & Schema Updates
- [ ] Extend Box model in Prisma schema
  - [ ] Add `color` field (string, optional)
  - [ ] Add `variant` enum (LANGSTROTH_DEEP, LANGSTROTH_SHALLOW, B_DEEP, B_SHALLOW, etc.)
  - [ ] Keep existing `type` field (BROOD, HONEY, FEEDER)
- [ ] Create database migration
- [ ] Update shared-schemas package
  - [ ] Add new fields to `boxSchema`
  - [ ] Create `BoxVariant` enum
  - [ ] Update TypeScript types

### 2. Backend API Updates
- [ ] Update `hive.service.ts` updateBoxes method
  - [ ] Handle new box fields
  - [ ] Add validation rules (max stack height, excluder placement)
- [ ] Update DTOs and validation schemas
- [ ] Test API endpoints with new fields

### 3. Frontend - Core Component Development
- [ ] Replace placeholder `BoxConfigurator` component
- [ ] Create `BoxStack` component for visual representation
- [ ] Create `BoxItem` component with:
  - [ ] Visual box with configurable height (deep vs shallow)
  - [ ] Color display
  - [ ] Frame count badge
  - [ ] Type/purpose label
  - [ ] Queen excluder indicator
- [ ] Implement drag & drop functionality
  - [ ] Install @dnd-kit/sortable library
  - [ ] Setup drag handlers
  - [ ] Implement reorder logic
  - [ ] Add visual feedback during drag

### 4. Frontend - Configuration Panel
- [ ] Create `BoxConfigPanel` component
  - [ ] Color picker (use existing UI components or add library)
  - [ ] Frame count input (1-10 or custom max)
  - [ ] Box type selector (BROOD, HONEY, FEEDER)
  - [ ] Box variant selector (deep/shallow variants)
  - [ ] Queen excluder toggle
- [ ] Add/Remove box buttons
- [ ] Save/Cancel/Reset buttons

### 5. Visual Design Implementation
- [ ] Define box dimensions and aspect ratios
  - [ ] Deep boxes: height = 1.5x base height
  - [ ] Shallow boxes: height = 1x base height
- [ ] Create color palette for box colors
- [ ] Design queen excluder visual (grid pattern or line)
- [ ] Add shadows and borders for depth
- [ ] Implement responsive design for mobile

### 6. API Integration
- [ ] Create `useUpdateHiveBoxes` hook in `useHives.ts`
- [ ] Implement optimistic updates
- [ ] Add loading states
- [ ] Add error handling and retry logic
- [ ] Cache management with React Query

### 7. Localization
- [ ] Add English translations to `/locales/en/hive.json`
  - [ ] Box configurator title and description
  - [ ] Box types and variants
  - [ ] Configuration labels
  - [ ] Help text and tooltips
  - [ ] Success/error messages
- [ ] Add Slovak translations to `/locales/sk/hive.json`
- [ ] Test language switching

### 8. Testing & Quality
- [ ] Unit tests for new components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for box configuration flow
- [ ] Accessibility testing
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] ARIA labels
- [ ] Performance testing with many boxes

### 9. Documentation
- [ ] Update API documentation
- [ ] Add component storybook stories (if applicable)
- [ ] Create user guide for box configurator
- [ ] Document configuration limits and rules

## Technical Decisions

### Libraries to Add
- `@dnd-kit/sortable` - For drag and drop functionality
- Consider: `react-colorful` or use native color input

### Component Structure
```
BoxConfigurator/
├── index.tsx           // Main component
├── BoxStack.tsx        // Visual stack container
├── BoxItem.tsx         // Individual box component
├── BoxConfigPanel.tsx  // Configuration panel
├── QueenExcluder.tsx   // Excluder visual component
└── types.ts            // Local type definitions
```

### State Management
- Use local component state for draft changes
- Sync with server on save
- Consider using form libraries (react-hook-form) for validation

## Acceptance Criteria
- [ ] Users can add unlimited boxes to a hive
- [ ] Each box can be configured with color, frames, type, and variant
- [ ] Boxes can be reordered via drag and drop
- [ ] Queen excluders can be placed between any boxes
- [ ] Visual representation shows correct aspect ratios
- [ ] Changes persist after page reload
- [ ] Works on desktop and mobile devices
- [ ] Supports both light and dark themes

## Future Enhancements (Phase 2)
- [ ] Preset configurations (e.g., "Standard Langstroth Setup")
- [ ] Copy configuration between hives
- [ ] Export/import configurations
- [ ] Visual indicators for box health/status
- [ ] Integration with inspection data (show which boxes were inspected)
- [ ] 3D visualization option
- [ ] AR view for mobile devices