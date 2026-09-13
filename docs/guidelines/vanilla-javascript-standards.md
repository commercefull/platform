# Vanilla JavaScript Standards

**Version:** 2.0  
**Last Updated:** January 2026

## Table of Contents

1. [Philosophy & Goals](#philosophy--goals)
2. [Core Principles](#core-principles)
3. [Architecture Patterns](#architecture-patterns)
4. [Implementation Guide](#implementation-guide)
5. [Testing Standards](#testing-standards)
6. [Migration Guide](#migration-guide)
7. [Quick Reference](#quick-reference)

---

## Philosophy & Goals

This document defines the standards for writing maintainable, testable, and scalable vanilla JavaScript in the clinic-organize application.

### Primary Goals

1. **100% Testability** - Business logic must be testable without a DOM environment
2. **Clear Separation of Concerns** - HTML for structure, JavaScript for behavior
3. **Maintainability** - Centralized logic that's easy to update and debug
4. **Performance** - Efficient event delegation, minimal listeners
5. **Security** - Eliminate inline scripts to reduce XSS attack surface
6. **Developer Experience** - Consistent patterns, clear conventions

---

## Core Principles

### Principle 1: No Inline Event Handlers

**❌ Never Do This:**

```html
<button onclick="deleteItem('123')">Delete</button>
<button onclick="previewCampaign()">Preview</button>
<a href="#" onclick="payFullAmount(); return false;">Pay Full</a>
```

**✅ Always Do This:**

```html
<button data-action="delete" data-id="123">Delete</button>
<button data-action="preview-campaign">Preview</button>
<a href="#" data-action="pay-full">Pay Full</a>
```

**Why?**

- **Security**: Inline handlers create XSS vulnerabilities
- **Testability**: Cannot unit test inline code
- **Maintainability**: Behavior scattered across HTML files
- **Content Security Policy**: Violates CSP `unsafe-inline` restrictions

### Principle 2: Event Delegation Over Direct Binding

**❌ Avoid:**

```javascript
document.querySelectorAll('[data-action="delete"]').forEach(btn => {
  btn.addEventListener('click', handleDelete);
});
```

**✅ Prefer:**

```javascript
document.addEventListener('click', event => {
  const actionEl = event.target.closest('[data-action="delete"]');
  if (actionEl) handleDelete(actionEl);
});
```

**Why?**

- **Performance**: One listener instead of hundreds
- **Dynamic Content**: Works with elements added after page load
- **Memory**: Fewer event listeners = less memory usage

### Principle 3: Separation of Concerns

```
┌─────────────────────────────────────────┐
│  HTML/EJS Templates                     │
│  • Structure & markup                   │
│  • Data attributes (intent)             │
│  • CSS classes (presentation)           │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  JavaScript Modules                     │
│  • Event delegation                     │
│  • Business logic                       │
│  • API communication                    │
│  • DOM updates                          │
└─────────────────────────────────────────┘
```

**HTML's Job:** Declare **what** should happen  
**JavaScript's Job:** Define **how** it happens

### Principle 4: Pure Functions for Business Logic

**❌ Tightly Coupled:**

```javascript
function processPatients() {
  const data = JSON.parse(document.getElementById('data').textContent);
  const filtered = data.filter(p => p.status === 'ACTIVE');
  document.getElementById('list').innerHTML = renderList(filtered);
}
```

**✅ Decoupled & Testable:**

```javascript
// Pure function - can test without DOM
export function filterActivePatients(patients) {
  return patients.filter(p => p.status === 'ACTIVE');
}

// UI orchestration
function updatePatientList() {
  const data = JSON.parse(document.getElementById('data').textContent);
  const filtered = filterActivePatients(data);
  document.getElementById('list').innerHTML = renderList(filtered);
}
```

**Why?**

- **Testability**: Pure functions can be tested in isolation
- **Reusability**: Same logic can be used in multiple contexts
- **Debugging**: Easier to debug deterministic functions
- **Refactoring**: Changes don't cascade through DOM dependencies

## Data Attribute Conventions

### Primary Attributes

| Attribute          | Purpose                          | Example                 |
| ------------------ | -------------------------------- | ----------------------- |
| `data-action`      | Identifies the action to perform | `data-action="delete"`  |
| `data-id`          | Entity ID for the action         | `data-id="abc-123"`     |
| `data-[entity]-id` | Specific entity ID               | `data-patient-id="xyz"` |

### Common Action Patterns

| Action        | Description      | Additional Attributes     |
| ------------- | ---------------- | ------------------------- |
| `delete`      | Delete an entity | `data-id`, `data-confirm` |
| `edit`        | Edit an entity   | `data-id`                 |
| `view`        | View details     | `data-id`                 |
| `toggle`      | Toggle state     | `data-id`, `data-state`   |
| `submit`      | Submit form      | -                         |
| `cancel`      | Cancel operation | -                         |
| `refresh`     | Refresh data     | -                         |
| `open-modal`  | Open a modal     | `data-modal-id`           |
| `close-modal` | Close a modal    | -                         |

### Contextual Attributes

For passing additional data to handlers:

```html
<button data-action="check-in" data-appointment-id="apt-123" data-patient-name="John Doe">Check In</button>

<button data-action="send-verification" data-appointment-id="apt-123" data-phone="+1234567890" data-channel="sms">Send Verification</button>
```

### Amount/Value Attributes

For numeric values:

```html
<button data-action="set-amount" data-amount="50">$50</button> <button data-action="set-amount" data-amount="100">$100</button>
```

---

## Architecture Patterns

### Pattern Overview

We support two module patterns depending on your needs:

1. **IIFE Pattern** - For existing code, backward compatibility, single-file modules
2. **ESM 3-Tier Pattern** - For new features, maximum testability, scalable architecture

### Pattern 1: IIFE Module Pattern

**When to use:**

- Migrating legacy code
- Single-page scripts
- Backward compatibility required
- Quick prototypes

**Structure:**

Each module follows a consistent internal organization:

```javascript
/**
 * Feature Module
 * Description of what this module handles
 */
const FeatureModule = (function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    API_ENDPOINTS: {
      ACTION: '/api/feature/action',
    },
    SELECTORS: {
      CONTAINER: '#feature-container',
      FORM: '#feature-form',
    },
  };

  // --- State ---
  let isInitialized = false;

  // --- Private Methods: Business Logic ---

  async function performAction(id) {
    // Implementation
  }

  // --- Private Methods: Event Handlers ---

  function handleClick(event) {
    const target = event.target;

    // Handle delete action
    if (target.closest('[data-action="delete"]')) {
      const id = target.closest('[data-action="delete"]').dataset.id;
      performDelete(id);
      return;
    }

    // Handle edit action
    if (target.closest('[data-action="edit"]')) {
      const id = target.closest('[data-action="edit"]').dataset.id;
      performEdit(id);
      return;
    }
  }

  // --- Private Methods: Lifecycle ---

  function bindEvents() {
    document.addEventListener('click', handleClick);
  }

  function unbindEvents() {
    document.removeEventListener('click', handleClick);
  }

  // --- Public API ---

  function init() {
    if (isInitialized) return;
    isInitialized = true;
    bindEvents();
    window.addEventListener('beforeunload', destroy);
  }

  function destroy() {
    unbindEvents();
    isInitialized = false;
  }

  return {
    init,
    destroy,
  };
})();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', FeatureModule.init);
} else {
  FeatureModule.init();
}
```

**Event Delegation Implementation:**

```javascript
function handleClick(event) {
  const target = event.target;

  // Use closest() to find the element with the data attribute
  const actionElement = target.closest('[data-action]');
  if (!actionElement) return;

  const action = actionElement.dataset.action;
  const id = actionElement.dataset.id;

  switch (action) {
    case 'delete':
      handleDelete(id, actionElement);
      break;
    case 'edit':
      handleEdit(id, actionElement);
      break;
    case 'toggle':
      handleToggle(id, actionElement);
      break;
    default:
      console.warn('Unknown action:', action);
  }
}
```

**Data Extraction Pattern:**

```javascript
function handleCheckIn(element) {
  const { appointmentId, patientName, serviceName } = element.dataset;

  // Use the extracted data
  performCheckIn(appointmentId, patientName, serviceName);
}
```

**Shared Utility Usage:**

For common patterns across the application:

```javascript
// In public/js/shared/event-delegation.js

EventDelegation.on('click', '[data-action="delete"]', (event, element) => {
  const id = element.dataset.id;
  handleDelete(id);
});

EventDelegation.on('click', '[data-action="edit"]', (event, element) => {
  const id = element.dataset.id;
  handleEdit(id);
});
```

---

## Implementation Guide

### HTML/EJS Templates

**Recommended Pattern:**

```ejs
<!-- Delete button -->
<button
  class="btn btn-danger btn-sm"
  data-action="delete"
  data-id="<%= item.id %>"
  data-confirm="Are you sure you want to delete this item?">
  <i class="ph ph-trash"></i> Delete
</button>

<!-- Edit button -->
<a
  class="btn btn-primary btn-sm"
  data-action="edit"
  data-id="<%= item.id %>">
  <i class="ph ph-pencil"></i> Edit
</a>

<!-- Toggle status -->
<button
  class="btn btn-outline-secondary btn-sm"
  data-action="toggle-status"
  data-id="<%= item.id %>"
  data-current-status="<%= item.status %>">
  Toggle
</button>

<!-- Quick amount buttons -->
<div class="btn-group">
  <button class="btn btn-outline-secondary" data-action="set-amount" data-amount="50">$50</button>
  <button class="btn btn-outline-secondary" data-action="set-amount" data-amount="100">$100</button>
  <button class="btn btn-outline-secondary" data-action="set-amount" data-amount="200">$200</button>
</div>

<!-- Form actions -->
<button type="button" class="btn btn-primary" data-action="preview">
  <i class="ph ph-eye"></i> Preview
</button>
<button type="button" class="btn btn-success" data-action="submit-form">
  <i class="ph ph-check"></i> Submit
</button>
```

**Script Loading:**

```ejs
<!-- At the end of the view, before the footer -->
<script src="/js/feature/feature-module.js"></script>
<%- include("../partials/app-footer") %>
```

### Backward Compatibility

**During Migration:**

```javascript
// Expose global functions for backward compatibility
window.deleteItem = function (id) {
  return FeatureModule.delete(id);
};

window.previewCampaign = function () {
  return FeatureModule.preview();
};
```

**Benefits:**

- Existing inline handlers continue working
- Migrate pages incrementally
- No breaking changes during transition

### File Organization

**Standard Directory Structure:**

```
public/js/
├── shared/              # Shared utilities
│   ├── event-delegation.js
│   ├── page-config.js
│   └── backend.js
├── [context]/           # Feature-specific modules
│   ├── [feature]-actions.js
│   ├── [feature]-form.js
│   └── [feature]-helpers.js
└── ...
```

**Examples:**

- `public/js/patient-flow/todays-patients-actions.js`
- `public/js/finance/billing-record-form.js`
- `public/js/marketing/campaign-builder.js`

**Alternative: Prefixed File Naming Convention**

When multiple features exist in the same directory, use prefixed naming to group related files:

```
public/js/analytics/
├── dashboard-visualizations.js           # Main orchestrator
├── dashboard-visualizations-api.js       # API layer
├── dashboard-visualizations-processor.js # Business logic layer
├── dashboard-visualizations.test.js      # Test suite
└── ...
```

**Benefits of Prefixed Naming:**

- **Logical Grouping**: Related files are clearly grouped together
- **Multiple Features**: Support multiple features in the same directory
- **Easy Discovery**: All files for a feature are alphabetically adjacent
- **Import Clarity**: Clear which files belong to which feature

**Import Pattern:**

```javascript
// dashboard-visualizations.js
import { fetchDashboardSummary, fetchWeeklyReport } from './dashboard-visualizations-api.js';

import { processKPIData, formatValue } from './dashboard-visualizations-processor.js';
```

**EJS Integration:**

```ejs
<!-- Only the main file needs to be included -->
<script type="module" src="/js/analytics/dashboard-visualizations.js"></script>
```

**Naming Convention:**

- Feature modules: `[feature].js` (main orchestrator)
- API modules: `[feature]-api.js`
- Processor modules: `[feature]-processor.js`
- Test files: `[feature]-processor.test.js` (matches processor file)

**When to Use:**

- ✅ Multiple related features in one directory
- ✅ Complex features requiring multiple files
- ✅ Clear separation of concerns needed
- ✅ Team prefers feature-based organization

**File Discovery:**

```bash
# Find all files for a feature
ls public/js/analytics/dashboard-visualizations*

# Output:
# dashboard-visualizations.js
# dashboard-visualizations-api.js
# dashboard-visualizations-processor.js
# dashboard-visualizations-processor.test.js
```

**Migration from Standard Structure:**

```bash
# Before (standard)
public/js/analytics/api.js
public/js/analytics/processor.js
public/js/analytics/main.js

# After (prefixed)
public/js/analytics/dashboard-visualizations-api.js
public/js/analytics/dashboard-visualizations-processor.js
public/js/analytics/dashboard-visualizations.js
```

**View templates** and **partials** remain unchanged:

- View templates: `[feature].ejs`
- Partials: `[partial-name].ejs`

### Common Patterns

#### Confirmation Before Action

```javascript
function handleDelete(id, element) {
  const confirmMessage = element.dataset.confirm || 'Are you sure?';
  if (!confirm(confirmMessage)) return;
  performDelete(id);
}
```

#### Prevent Default for Links

```javascript
function handleClick(event) {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) return;

  if (actionElement.tagName === 'A') {
    event.preventDefault();
  }

  // Handle the action...
}
```

#### Loading State Management

```javascript
async function handleSubmit(element) {
  const originalText = element.innerHTML;
  element.disabled = true;
  element.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';

  try {
    await performSubmit();
  } finally {
    element.disabled = false;
    element.innerHTML = originalText;
  }
}
```

#### Data Flow Visualization

```
User Click
    ↓
Event Delegation (document.addEventListener)
    ↓
Action Handler (switch/if)
    ↓
Business Logic (fetch, transform)
    ↓
API Call
    ↓
UI Update (DOM manipulation)
```

---

## Migration Guide

### Step-by-Step Migration

When migrating a view from inline handlers to data attributes:

**Step 1: Audit Inline Handlers**

```bash
# Search for inline event handlers
grep -r 'onclick=' views/
grep -r 'onchange=' views/
grep -r 'oninput=' views/
grep -r 'onsubmit=' views/
```

**Step 2: Create JavaScript Module**

```javascript
// Create public/js/[context]/[feature]-actions.js
const FeatureActions = (function () {
  'use strict';

  function handleClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    switch (actionEl.dataset.action) {
      case 'delete':
        handleDelete(actionEl.dataset.id);
        break;
      // Add more cases...
    }
  }

  function init() {
    document.addEventListener('click', handleClick);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', FeatureActions.init);
```

**Step 3: Update HTML Templates**

```html
<!-- Before -->
<button onclick="deleteItem('123')">Delete</button>

<!-- After -->
<button data-action="delete" data-id="123">Delete</button>
```

**Step 4: Add Backward Compatibility (Optional)**

```javascript
// Expose global functions for gradual migration
window.deleteItem = id => FeatureModule.delete(id);
```

**Step 5: Test Thoroughly**

- [ ] All actions work correctly
- [ ] Dynamic content (AJAX-loaded elements) work
- [ ] Keyboard navigation still functions
- [ ] No console errors
- [ ] Loading states show properly

### Migration Priority

**High Priority:**

- Forms with sensitive data
- Frequently used actions
- Pages with CSP violations

**Medium Priority:**

- Admin pages
- Settings pages
- Report pages

**Low Priority:**

- Rarely accessed pages
- Internal tools
- Legacy features

---

## Testing Standards

### Overview

Testing vanilla JavaScript requires proper Jest configuration to handle ES Modules. This section demonstrates how to set up Jest and write comprehensive tests for pure processor functions.

### Jest Setup for Vanilla JavaScript

#### 1. Install Dependencies

```bash
# Install Jest and required dependencies
npm install --save-dev jest @types/jest
# OR
yarn add --dev jest @types/jest

# For ES Module support
npm install --save-dev babel-jest @babel/core @babel/preset-env
# OR
yarn add --dev babel-jest @babel/core @babel/preset-env
```

#### 2. Configure Babel

Create `babel.config.js` in your project root:

```javascript
// babel.config.js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
```

#### 3. Configure Jest

Create `jest.config.js` in your project root:

```javascript
// jest.config.js
module.exports = {
  // Test environment
  testEnvironment: 'node', // Use 'jsdom' if you need DOM testing

  // Transform ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Test match patterns
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],

  // Coverage configuration
  collectCoverageFrom: ['public/js/**/*.js', '!public/js/**/*.test.js', '!public/js/**/*.spec.js'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};
```

#### 4. Add NPM Scripts

Add to your `package.json`:

````json
{
  "scripts": {
    "test": "jest",
    "test:js": "jest --testPathPattern=\"public/js/.*\\.test\\.js$\"",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:js:coverage": "jest --testPathPattern=\"public/js/.*\\.test\\.js$\" --coverage",
    "test:verbose": "jest --verbose"
  }
}

### Example: Testing a Processor Module

#### Processor File to Test

Create `public/js/patient-flow/patient-processor.js`:

```javascript
// public/js/patient-flow/patient-processor.js

/**
 * Transform raw patient data from API into UI-ready format
 * @param {Array} rawPatients - Raw patient data from API
 * @returns {Array} Transformed patient objects
 */
export function transformPatients(rawPatients) {
  if (!Array.isArray(rawPatients)) {
    return [];
  }

  return rawPatients.map(patient => ({
    id: patient.patientId,
    fullName: formatFullName(patient.firstName, patient.lastName),
    age: calculateAge(patient.dateOfBirth),
    status: normalizeStatus(patient.status),
    priority: determinePriority(patient),
    displayPhone: formatPhoneNumber(patient.phone),
  }));
}

/**
 * Filter patients by status
 * @param {Array} patients - Patient array
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered patients
 */
export function filterByStatus(patients, status) {
  if (!Array.isArray(patients) || !status) {
    return patients || [];
  }

  if (status.toLowerCase() === 'all') {
    return patients;
  }

  return patients.filter(p => p.status === status);
}

/**
 * Sort patients by priority
 * @param {Array} patients - Patient array
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted patients
 */
export function sortByPriority(patients, order = 'desc') {
  if (!Array.isArray(patients)) {
    return [];
  }

  const priorityWeight = {
    critical: 4,
    urgent: 3,
    normal: 2,
    low: 1,
  };

  return [...patients].sort((a, b) => {
    const weightA = priorityWeight[a.priority] || 0;
    const weightB = priorityWeight[b.priority] || 0;
    return order === 'asc' ? weightA - weightB : weightB - weightA;
  });
}

/**
 * Search patients by name or phone
 * @param {Array} patients - Patient array
 * @param {string} query - Search query
 * @returns {Array} Matching patients
 */
export function searchPatients(patients, query) {
  if (!Array.isArray(patients) || !query) {
    return patients || [];
  }

  const lowerQuery = query.toLowerCase();

  return patients.filter(
    p =>
      p.fullName.toLowerCase().includes(lowerQuery) ||
      p.displayPhone.includes(query),
  );
}

// ============================================================================
// PRIVATE HELPER FUNCTIONS
// ============================================================================

/**
 * Format full name
 * @private
 */
function formatFullName(firstName, lastName) {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  return `${first} ${last}`.trim() || 'Unknown';
}

/**
 * Calculate age from date of birth
 * @private
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Normalize status string
 * @private
 */
function normalizeStatus(status) {
  const statusMap = {
    CHECKED_IN: 'checked-in',
    WAITING: 'waiting',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };

  return statusMap[status] || 'unknown';
}

/**
 * Determine patient priority
 * @private
 */
function determinePriority(patient) {
  if (patient.isEmergency) return 'critical';
  if (patient.age < 2 || patient.age > 70) return 'urgent';
  if (patient.appointmentType === 'FOLLOW_UP') return 'normal';
  return 'low';
}

/**
 * Format phone number for display
 * @private
 */
function formatPhoneNumber(phone) {
  if (!phone) return 'N/A';

  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format: (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}
````

#### Jest Test File

Create `public/js/patient-flow/patient-processor.test.js`:

```javascript
// public/js/patient-flow/patient-processor.test.js

import { transformPatients, filterByStatus, sortByPriority, searchPatients } from './patient-processor.js';

describe('Patient Processor', () => {
  // ========================================================================
  // TEST DATA
  // ========================================================================

  const mockRawPatients = [
    {
      patientId: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-06-15',
      status: 'CHECKED_IN',
      phone: '5551234567',
      isEmergency: false,
      age: 38,
      appointmentType: 'CONSULTATION',
    },
    {
      patientId: 'p2',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '2022-03-20',
      status: 'WAITING',
      phone: '5559876543',
      isEmergency: false,
      age: 1,
      appointmentType: 'CHECKUP',
    },
    {
      patientId: 'p3',
      firstName: 'Bob',
      lastName: 'Emergency',
      dateOfBirth: '1990-01-01',
      status: 'IN_PROGRESS',
      phone: '5555555555',
      isEmergency: true,
      age: 34,
      appointmentType: 'EMERGENCY',
    },
  ];

  // ========================================================================
  // transformPatients()
  // ========================================================================

  describe('transformPatients()', () => {
    it('should transform raw patient data correctly', () => {
      const result = transformPatients(mockRawPatients);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'p1',
        fullName: 'John Doe',
        age: expect.any(Number),
        status: 'checked-in',
        priority: 'low',
        displayPhone: '(555) 123-4567',
      });
    });

    it('should handle empty array', () => {
      const result = transformPatients([]);
      expect(result).toEqual([]);
    });

    it('should handle null input', () => {
      const result = transformPatients(null);
      expect(result).toEqual([]);
    });

    it('should handle undefined input', () => {
      const result = transformPatients(undefined);
      expect(result).toEqual([]);
    });

    it('should handle missing first/last name', () => {
      const patient = [{ patientId: 'p1', firstName: '', lastName: '' }];
      const result = transformPatients(patient);
      expect(result[0].fullName).toBe('Unknown');
    });

    it('should determine priority correctly for emergency', () => {
      const result = transformPatients([mockRawPatients[2]]);
      expect(result[0].priority).toBe('critical');
    });

    it('should determine priority correctly for infant', () => {
      const result = transformPatients([mockRawPatients[1]]);
      expect(result[0].priority).toBe('urgent');
    });
  });

  // ========================================================================
  // filterByStatus()
  // ========================================================================

  describe('filterByStatus()', () => {
    const transformedPatients = [
      { id: 'p1', fullName: 'John Doe', status: 'checked-in' },
      { id: 'p2', fullName: 'Jane Smith', status: 'waiting' },
      { id: 'p3', fullName: 'Bob Emergency', status: 'in-progress' },
    ];

    it('should filter by status correctly', () => {
      const result = filterByStatus(transformedPatients, 'checked-in');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
    });

    it('should return all patients when status is "all"', () => {
      const result = filterByStatus(transformedPatients, 'all');
      expect(result).toHaveLength(3);
    });

    it('should return all patients when status is "ALL"', () => {
      const result = filterByStatus(transformedPatients, 'ALL');
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no matches', () => {
      const result = filterByStatus(transformedPatients, 'cancelled');
      expect(result).toHaveLength(0);
    });

    it('should handle null patients array', () => {
      const result = filterByStatus(null, 'checked-in');
      expect(result).toEqual([]);
    });

    it('should handle missing status parameter', () => {
      const result = filterByStatus(transformedPatients, null);
      expect(result).toEqual(transformedPatients);
    });
  });

  // ========================================================================
  // sortByPriority()
  // ========================================================================

  describe('sortByPriority()', () => {
    const patients = [
      { id: 'p1', priority: 'normal' },
      { id: 'p2', priority: 'critical' },
      { id: 'p3', priority: 'low' },
      { id: 'p4', priority: 'urgent' },
    ];

    it('should sort by priority descending (default)', () => {
      const result = sortByPriority(patients);
      expect(result[0].priority).toBe('critical');
      expect(result[1].priority).toBe('urgent');
      expect(result[2].priority).toBe('normal');
      expect(result[3].priority).toBe('low');
    });

    it('should sort by priority ascending', () => {
      const result = sortByPriority(patients, 'asc');
      expect(result[0].priority).toBe('low');
      expect(result[1].priority).toBe('normal');
      expect(result[2].priority).toBe('urgent');
      expect(result[3].priority).toBe('critical');
    });

    it('should not mutate original array', () => {
      const original = [...patients];
      sortByPriority(patients);
      expect(patients).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortByPriority([]);
      expect(result).toEqual([]);
    });

    it('should handle null input', () => {
      const result = sortByPriority(null);
      expect(result).toEqual([]);
    });

    it('should handle unknown priority values', () => {
      const unknownPatients = [
        { id: 'p1', priority: 'unknown-priority' },
        { id: 'p2', priority: 'critical' },
      ];
      const result = sortByPriority(unknownPatients);
      expect(result[0].priority).toBe('critical');
      expect(result[1].priority).toBe('unknown-priority');
    });
  });

  // ========================================================================
  // searchPatients()
  // ========================================================================

  describe('searchPatients()', () => {
    const patients = [
      { id: 'p1', fullName: 'John Doe', displayPhone: '(555) 123-4567' },
      { id: 'p2', fullName: 'Jane Smith', displayPhone: '(555) 987-6543' },
      { id: 'p3', fullName: 'Bob Johnson', displayPhone: '(555) 555-5555' },
    ];

    it('should search by name (case-insensitive)', () => {
      const result = searchPatients(patients, 'john');
      expect(result).toHaveLength(2); // John Doe and Bob Johnson
    });

    it('should search by phone number', () => {
      const result = searchPatients(patients, '555-5555');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p3');
    });

    it('should return all patients when query is empty', () => {
      const result = searchPatients(patients, '');
      expect(result).toEqual(patients);
    });

    it('should return empty array when no matches', () => {
      const result = searchPatients(patients, 'xyz123');
      expect(result).toHaveLength(0);
    });

    it('should handle null patients array', () => {
      const result = searchPatients(null, 'john');
      expect(result).toEqual([]);
    });

    it('should handle null query', () => {
      const result = searchPatients(patients, null);
      expect(result).toEqual(patients);
    });
  });

  // ========================================================================
  // INTEGRATION TESTS
  // ========================================================================

  describe('Integration: Full Pipeline', () => {
    it('should transform, filter, sort, and search correctly', () => {
      // 1. Transform
      let result = transformPatients(mockRawPatients);
      expect(result).toHaveLength(3);

      // 2. Filter by status
      result = filterByStatus(result, 'waiting');
      expect(result).toHaveLength(1);

      // 3. Sort by priority
      result = sortByPriority([...mockRawPatients.map(transformPatients)].flat());
      expect(result[0].priority).toBe('critical');

      // 4. Search
      const allTransformed = transformPatients(mockRawPatients);
      result = searchPatients(allTransformed, 'jane');
      expect(result).toHaveLength(1);
      expect(result[0].fullName).toContain('Jane');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test
# OR
yarn test

# Run only vanilla JS tests
npm run test:js
# OR
yarn test:js

# Run vanilla JS tests with coverage
npm run test:js:coverage
# OR
yarn test:js:coverage

# Run tests in watch mode
npm run test:watch
# OR
yarn test:watch

# Run with coverage report
npm run test:coverage
# OR
yarn test:coverage

# Run specific test file
npm test -- patient-processor.test.js
# OR
yarn test patient-processor.test.js

# Run tests matching pattern
npm test -- --testNamePattern="transformPatients"
# OR
yarn test --testNamePattern="transformPatients"
```

### Coverage Report Example

After running `npm run test:coverage`, you'll see:

```
 PASS  public/js/patient-flow/patient-processor.test.js
  Patient Processor
    transformPatients()
      ✓ should transform raw patient data correctly (4 ms)
      ✓ should handle empty array (1 ms)
      ✓ should handle null input (1 ms)
      ✓ should handle undefined input
      ✓ should handle missing first/last name (1 ms)
      ✓ should determine priority correctly for emergency
      ✓ should determine priority correctly for infant
    filterByStatus()
      ✓ should filter by status correctly
      ✓ should return all patients when status is "all"
      ✓ should return all patients when status is "ALL"
      ✓ should return empty array when no matches
      ✓ should handle null patients array
      ✓ should handle missing status parameter
    sortByPriority()
      ✓ should sort by priority descending (default) (1 ms)
      ✓ should sort by priority ascending
      ✓ should not mutate original array
      ✓ should handle empty array
      ✓ should handle null input
      ✓ should handle unknown priority values
    searchPatients()
      ✓ should search by name (case-insensitive)
      ✓ should search by phone number
      ✓ should return all patients when query is empty
      ✓ should return empty array when no matches
      ✓ should handle null patients array
      ✓ should handle null query
    Integration: Full Pipeline
      ✓ should transform, filter, sort, and search correctly

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        1.234 s

---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|-------------------
All files            |     100 |      100 |     100 |     100 |
 patient-processor.js|     100 |      100 |     100 |     100 |
---------------------|---------|----------|---------|---------|-------------------
```

### Best Practices for Testing Vanilla JS

**1. Test Pure Functions Only**

- Focus tests on processor modules (no DOM)
- Mock external dependencies
- Test edge cases and error conditions

**2. Comprehensive Test Coverage**

- Happy path scenarios
- Empty/null/undefined inputs
- Boundary conditions
- Integration scenarios

**3. Test Organization**

```javascript
describe('ModuleName', () => {
  describe('functionName()', () => {
    it('should handle normal case', () => {});
    it('should handle edge case', () => {});
    it('should throw error when invalid', () => {});
  });
});
```

**4. Use Descriptive Test Names**

```javascript
// ❌ Bad
it('works', () => {});

// ✅ Good
it('should return empty array when input is null', () => {});
```

**5. Test Data Isolation**

```javascript
// Create fresh test data for each test
beforeEach(() => {
  testData = createTestData();
});
```

**6. Avoid Testing Implementation Details**

```javascript
// ❌ Bad - testing private function
test('formatFullName() works', () => {});

// ✅ Good - testing public API
test('transformPatients() formats names correctly', () => {});
```

---

## Quick Reference

### Decision Matrix

**Choose IIFE Pattern when:**

- ✅ Migrating legacy code
- ✅ Single-page scripts
- ✅ Need backward compatibility
- ✅ Quick prototypes

**Choose ESM 3-Tier when:**

- ✅ New feature development
- ✅ Complex business logic
- ✅ Requires comprehensive testing
- ✅ Long-term maintainability

### Data Attributes Quick Guide

| Attribute          | Usage                            | Example                        |
| ------------------ | -------------------------------- | ------------------------------ |
| `data-action`      | **Required** - Action identifier | `data-action="delete"`         |
| `data-id`          | Entity identifier                | `data-id="abc-123"`            |
| `data-confirm`     | Confirmation message             | `data-confirm="Are you sure?"` |
| `data-[entity]-id` | Specific entity ID               | `data-patient-id="xyz"`        |
| Custom attributes  | Contextual data                  | `data-phone="+1234"`           |

### Common Actions

| Action        | Description   | Additional Data           |
| ------------- | ------------- | ------------------------- |
| `delete`      | Delete entity | `data-id`, `data-confirm` |
| `edit`        | Edit entity   | `data-id`                 |
| `view`        | View details  | `data-id`                 |
| `submit`      | Submit form   | -                         |
| `refresh`     | Reload data   | -                         |
| `toggle`      | Toggle state  | `data-id`, `data-state`   |
| `open-modal`  | Open modal    | `data-modal-id`           |
| `close-modal` | Close modal   | -                         |

### Standards Checklist

**Before Committing Code:**

- [ ] No inline `onclick`, `onchange`, `oninput`, `onsubmit` handlers
- [ ] All actions use `data-action` attributes
- [ ] Event delegation pattern implemented
- [ ] Business logic separated into pure functions (for ESM)
- [ ] Loading states shown for async operations
- [ ] Error handling with try/catch
- [ ] User-friendly error messages
- [ ] Module provides `init()` and `destroy()` methods
- [ ] Tests written for pure functions
- [ ] No console errors in browser

### Module Template (Quick Copy)

**IIFE Pattern:**

```javascript
/**
 * [Feature] Module
 * Handles [description of what this module manages]
 */
const FeatureModule = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  const CONFIG = {
    API_ENDPOINTS: {
      LIST: '/api/feature',
      CREATE: '/api/feature',
      UPDATE: '/api/feature/{id}',
      DELETE: '/api/feature/{id}',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  let isInitialized = false;
  let currentData = null;

  // ═══════════════════════════════════════════════════════════
  // BUSINESS LOGIC (Private)
  // ═══════════════════════════════════════════════════════════

  async function performCreate(data) {
    const response = await fetch(CONFIG.API_ENDPOINTS.CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async function performDelete(id) {
    const url = CONFIG.API_ENDPOINTS.DELETE.replace('{id}', id);
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
    });
    return response.json();
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS (Private)
  // ═══════════════════════════════════════════════════════════

  function handleClick(event) {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.dataset.action;

    switch (action) {
      case 'create-item':
        event.preventDefault();
        handleCreate(actionElement);
        break;
      case 'delete-item':
        event.preventDefault();
        handleDelete(actionElement);
        break;
      case 'refresh':
        event.preventDefault();
        location.reload();
        break;
    }
  }

  async function handleCreate(element) {
    // Extract data from form or element
    const result = await performCreate({
      /* data */
    });
    if (result.ok) {
      showSuccess('Item created!');
      location.reload();
    } else {
      showError(result.error || 'Failed to create');
    }
  }

  async function handleDelete(element) {
    const id = element.dataset.id;
    const confirmMsg = element.dataset.confirm;

    if (confirmMsg && !confirm(confirmMsg)) return;

    const result = await performDelete(id);
    if (result.ok) {
      showSuccess('Item deleted!');
      location.reload();
    } else {
      showError(result.error || 'Failed to delete');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI HELPERS (Private)
  // ═══════════════════════════════════════════════════════════

  function showSuccess(message) {
    if (typeof window.successSnackbar === 'function') {
      window.successSnackbar(message);
    } else {
      alert(message);
    }
  }

  function showError(message) {
    if (typeof window.errorSnackbar === 'function') {
      window.errorSnackbar(message);
    } else {
      alert(message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE (Private)
  // ═══════════════════════════════════════════════════════════

  function bindEvents() {
    document.addEventListener('click', handleClick);
  }

  function unbindEvents() {
    document.removeEventListener('click', handleClick);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════

  function init() {
    if (isInitialized) return;
    isInitialized = true;
    bindEvents();
    window.addEventListener('beforeunload', destroy);
  }

  function destroy() {
    unbindEvents();
    isInitialized = false;
  }

  return {
    init,
    destroy,
    // Expose for backward compatibility if needed
    performCreate,
    performDelete,
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', FeatureModule.init);
} else {
  FeatureModule.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureModule;
}
```

**ESM 3-Tier Template:**

```javascript
// api.js
export async function fetchData(id) {
  const response = await fetch(`/api/resource/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// processor.js
export function transformData(raw) {
  return raw.map(item => ({
    id: item.id,
    name: `${item.firstName} ${item.lastName}`,
  }));
}

// main.js
import { fetchData } from './api.js';
import { transformData } from './processor.js';

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    if (el.dataset.action === 'load') {
      el.textContent = 'Loading...';
      try {
        const raw = await fetchData(el.dataset.id);
        const data = transformData(raw);
        render(data);
      } catch (err) {
        alert('Error loading data');
      }
    }
  });
});
```

### Best Practices Summary

**✅ DO:**

- Use `data-action` for all user interactions
- Implement event delegation
- Separate business logic into pure functions
- Show loading states
- Handle errors gracefully
- Write unit tests for processors
- Use semantic action names

**❌ DON'T:**

- Use inline event handlers
- Mix DOM queries with business logic
- Ignore error states
- Forget to clean up event listeners
- Hard-code values in event handlers
- Skip testing pure functions

### Performance Tips

1. **Event Delegation** - One listener per event type, not per element
2. **Debounce/Throttle** - For high-frequency events (scroll, resize)
3. **Cache DOM Queries** - Store selectors in module scope
4. **Lazy Load** - Load modules only when needed
5. **Code Splitting** - Use dynamic imports for large features

### Security Considerations

1. **XSS Prevention** - No inline scripts, CSP compliance
2. **Data Validation** - Validate in pure functions before API calls
3. **CSRF Protection** - Include credentials in fetch requests
4. **Sanitize Output** - Use `textContent` over `innerHTML` when possible

---

## Conclusion

Following these vanilla JavaScript standards ensures:

- **Maintainable** codebase with clear separation of concerns
- **Testable** business logic isolated from DOM
- **Performant** applications with efficient event handling
- **Secure** code that passes CSP requirements
- **Scalable** architecture that grows with your application

For questions or clarifications, refer to existing implementations in:

- `public/js/patient-flow/todays-patients-actions.js`
- `public/js/finance/billing-record-form.js`
- `public/js/marketing/campaign-builder.js`

**Happy coding! 🚀**
