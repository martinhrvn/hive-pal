---
sidebar_position: 3
title: Hive Management
---

# Hive Management

Hives are the heart of your beekeeping operation. Hive-Pal helps you track the status, configuration, and history of each hive with comprehensive management tools.

## Video Tutorial

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <div style={{padding: '2rem', background: '#f0f0f0', borderRadius: '8px'}}>
    [Video: Complete Hive Management Guide - Coming Soon]
  </div>
</div>

## Creating a Hive

### Quick Add Single Hive

Using the FAB (Floating Action Button):
1. Click the **FAB** button in the bottom right
2. Select **"New Hive"**
3. Fill in essential details:
   - **Name/Number**: Unique identifier
   - **Apiary**: Select location
   - **Status**: Active, Inactive, etc.
4. Click **"Save"**

### Detailed Hive Setup

For comprehensive hive configuration:

1. Navigate to **Hives** section or an apiary's detail page
2. Click **"Add Hive"**
3. Configure all aspects:

#### Basic Information
- **Identifier**: Name or number (e.g., "Hive 1", "Blue-23")
- **Type**: Langstroth, Top Bar, Warre, etc.
- **Origin**: Package, nuc, swarm, split
- **Installation Date**: When colony was established

#### Physical Configuration
- **Box Setup**: Number and types of boxes
- **Frame Count**: Frames per box
- **Foundation Type**: Wax, plastic, foundationless
- **Entrance Configuration**: Bottom, top, reduced

#### Colony Details
- **Queen**: Link to queen record
- **Colony Strength**: Frames of bees
- **Temperament**: Gentle, defensive, aggressive
- **Genetics**: Carniolan, Italian, Russian, etc.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <div style={{padding: '1rem', background: '#f0f0f0', borderRadius: '8px'}}>
    [Video: Setting Up Your First Hive - Coming Soon]
  </div>
</div>

## Bulk Adding Hives

### Quick Bulk Add

Perfect for adding multiple hives quickly:

1. Click **"Bulk Add Hives"** button
2. Enter hive identifiers (one per line):
   ```
   Hive-1
   Hive-2
   Hive-3
   Blue-A
   Blue-B
   ```
3. Select common attributes:
   - Apiary location
   - Default status
   - Box configuration template
4. Click **"Create All"**

### CSV Import

For large-scale operations:

1. Prepare CSV file with columns:
   - name
   - apiary
   - status
   - queen_id
   - installation_date
   - notes
2. Click **"Import from CSV"**
3. Map columns to fields
4. Preview and confirm
5. Import all records

### Template Cloning

Duplicate existing hive configurations:

1. Select source hive as template
2. Specify number of copies
3. Choose naming pattern:
   - Sequential numbering
   - Prefix/suffix addition
   - Custom format
4. Apply and create

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <div style={{padding: '1rem', background: '#f0f0f0', borderRadius: '8px'}}>
    [Video: Bulk Adding Hives Efficiently - Coming Soon]
  </div>
</div>

## Hive Configuration Management

### Box Management

Track your hive's physical structure:

**Adding Boxes**:
1. Go to hive details
2. Click **"Manage Boxes"**
3. Add box with details:
   - Type (deep, medium, shallow)
   - Purpose (brood, honey super)
   - Frame count
   - Position in stack

**Box Operations**:
- Reorder boxes (drag and drop)
- Remove boxes
- Track box history
- Note box condition

### Frame Tracking

**Frame Details**:
- Age of frames
- Foundation type
- Drawn comb percentage
- Replacement schedule

**Frame Rotation**:
- Track frame movement
- Plan replacements
- Monitor comb condition

### Equipment Association

Link equipment to specific hives:
- Feeders (type, capacity)
- Entrance reducers
- Queen excluders
- Ventilation equipment
- Treatments applied

## Hive Status Management

### Status Categories

**Active Statuses**:
- **Thriving**: Strong, productive colony
- **Normal**: Standard colony performance
- **Building**: New or recovering colony
- **Weak**: Needs attention

**Inactive Statuses**:
- **Queenless**: No laying queen present
- **Combining**: Being merged with another
- **Dead Out**: Colony died
- **Removed**: Hive no longer at location

**Special Statuses**:
- **Swarmed**: Colony swarmed recently
- **Split**: Recently divided
- **Requeening**: Queen replacement in progress
- **Treatment**: Under treatment for pests/disease

### Status History

Track status changes over time:
- Automatic logging of changes
- Reason for status change
- Date and user who made change
- Notes for context

## Queen Management

### Linking Queens

Associate queens with hives:
1. From hive details, click **"Manage Queen"**
2. Select existing queen or create new
3. Set introduction date
4. Track acceptance status

### Queen History

View complete queen lineage:
- Previous queens in hive
- Performance comparisons
- Replacement reasons
- Genetic tracking

For detailed queen management, see [Queen Management Guide](./queens).

## Inspection Integration

### Quick Inspection Entry

From hive details:
1. Click **"New Inspection"**
2. Use quick form for common observations
3. Save immediately

### Inspection History

View all inspections for a hive:
- Chronological timeline
- Key metrics over time
- Photo gallery
- Notes and observations

See [Inspections Guide](./inspections) for detailed information.

## Hive Analytics

### Performance Metrics

**Productivity Indicators**:
- Honey production
- Population growth
- Queen performance
- Disease resistance

**Health Tracking**:
- Varroa levels
- Disease occurrences
- Treatment effectiveness
- Survival rates

### Comparative Analysis

Compare hives:
- Within same apiary
- Across all apiaries
- By genetics
- By management style

### Trend Analysis

Visualize trends:
- Population curves
- Production graphs
- Seasonal patterns
- Multi-year comparisons

## Advanced Features

### Hive Groups

Organize hives into logical groups:
- By genetics
- By experiment
- By management protocol
- By production goals

### Tags and Labels

Custom categorization:
- Add unlimited tags
- Color coding
- Filter by tags
- Bulk tag operations

### QR Codes

Generate QR codes for hives:
1. Create unique QR code
2. Print weatherproof label
3. Attach to hive
4. Scan for instant access

### GPS Tracking

For migratory beekeeping:
- Track hive movements
- Location history
- Route optimization
- Theft prevention

## Scheduling and Tasks

### Inspection Scheduling

Set up regular inspections:
- Weekly during season
- Monthly maintenance
- Seasonal assessments
- Custom intervals

### Task Assignment

Create hive-specific tasks:
- Feed colony
- Add super
- Treat for mites
- Replace queen

### Reminders

Get notified about:
- Overdue inspections
- Scheduled treatments
- Seasonal tasks
- Equipment needs

## Data Management

### Export Options

Export hive data:
- PDF reports
- CSV spreadsheets
- JSON for APIs
- Custom formats

### Backup and Archive

**Archiving Hives**:
- Preserve all data
- Remove from active view
- Can restore anytime

**Data Backup**:
- Automatic backups
- Manual snapshots
- Version history

### Integration

Connect with other tools:
- Spreadsheet sync
- API access
- Webhook notifications
- Third-party apps

## Mobile Features

### Field Updates

Optimized for mobile use:
- Large touch targets
- Offline capability
- Voice notes
- Quick photo capture

### Barcode Scanning

Use phone camera to:
- Scan hive QR codes
- Read equipment barcodes
- Quick identification

## Best Practices

### Naming Conventions

**Sequential Systems**:
- Simple numbers: 1, 2, 3
- Year prefix: 2024-1, 2024-2
- Location code: N1, N2, S1, S2

**Descriptive Systems**:
- Color coding: Blue-1, Red-2
- Queen lineage: Carni-A1, Buck-B2
- Purpose: Honey-1, Brood-2

### Record Keeping

**Essential Records**:
- Installation date
- Queen information
- Treatment history
- Production records

**Recommended Details**:
- Colony temperament
- Genetic information
- Special characteristics
- Management notes

### Regular Maintenance

**Update Schedules**:
- Status checks weekly
- Configuration monthly
- Full review seasonally
- Annual planning

## Troubleshooting

### Common Issues

**Hive not appearing**:
- Check filters
- Verify apiary assignment
- Clear cache
- Refresh page

**Can't edit hive**:
- Check permissions
- Verify not archived
- Ensure not locked
- Contact admin

**Data not saving**:
- Check connection
- Verify required fields
- Look for error messages
- Try again later

## Tips for Success

### Organization

- Consistent naming system
- Regular status updates
- Complete configuration details
- Thorough documentation

### Efficiency

- Use bulk operations
- Create templates
- Set up automation
- Mobile field entry

### Analysis

- Regular performance reviews
- Compare similar hives
- Track trends over time
- Data-driven decisions

## Related Features

- [Apiary Management](./apiaries) - Organize locations
- [Queen Management](./queens) - Track queen details
- [Inspections](./inspections) - Record observations
- [Harvest Tracking](./harvest) - Monitor production
- [Equipment Management](./equipment) - Track resources