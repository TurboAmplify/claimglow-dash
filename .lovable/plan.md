
# Implementation Plan: Adjuster Search, Deal Navigation, and Form Improvements

## Summary
This plan addresses six key improvements across the application:
1. Search box for the "View by Adjuster" page
2. Clickable deals in Sales Dashboard that navigate to "My Dashboard"
3. Fix decimal precision issues in commission details
4. Show office on deal cards in "My Dashboard"
5. Replace dropdown selectors with autocomplete text inputs for adjusters/salespeople
6. Add ability to create new adjusters/salespeople inline with confirmation dialog

---

## 1. Adjuster Search Box

**Location:** `src/pages/AdjustersPage.tsx`

**Changes:**
- Add a search input field with a `Search` icon at the top of the filter section
- Implement real-time filtering as the user types
- Filter adjusters by name (case-insensitive, partial match)
- Place the search box prominently above the existing multi-select filters

**UI Behavior:**
- As users type, the adjuster cards filter immediately
- Clear button to reset search
- Placeholder text: "Search adjusters..."

---

## 2. Clickable Deals in Sales Dashboard

**Location:** `src/pages/SalesDashboardPage.tsx`

**Changes:**
- Make each row in the "Commission Details" table clickable
- Add cursor pointer styling and hover effect
- On click, navigate to `/sales/person/{salesperson_id}?deal={commission_id}`
- The Salesperson Dashboard will scroll to or highlight the specific deal

**Additional Changes to `src/pages/SalespersonDashboardPage.tsx`:**
- Read URL query parameter `deal` 
- Auto-switch to "Commissions" tab if deal param exists
- Pass the deal ID to `CommissionRecordsSection` for highlighting

**Changes to `src/components/salesperson/CommissionEstimator.tsx`:**
- Accept optional `highlightDealId` prop
- Auto-scroll to and highlight the matching deal card

---

## 3. Fix Decimal Precision in Commission Details

**Location:** `src/pages/SalesDashboardPage.tsx` (lines 375-377)

**Current Issue:**
- `percent_change` displays with `.toFixed(1)` but raw database values may have more precision
- Other percentage fields also showing too many decimals

**Changes:**
- Ensure all percentage displays use `.toFixed(1)` consistently
- Format fee and commission percentages to 1 decimal place
- Apply same formatting to split percentage

---

## 4. Show Office on Deal Cards in My Dashboard

**Location:** `src/components/salesperson/DealCard.tsx`

**Current State:**
- Office is already displayed in the header (line 191), but only shows the raw code (H/D)

**Changes:**
- Map office codes to full names: "H" -> "Houston", "D" -> "Dallas"
- Make office more visible with a badge or distinct styling
- Ensure it displays prominently even if adjuster is not set

---

## 5. Autocomplete Text Input for Adjusters and Salespeople

**Affected Files:**
- `src/components/salesperson/AddClientDealForm.tsx` (main Add/Edit deal form)
- `src/components/dashboard/EditSalesRecordDialog.tsx`
- `src/components/settings/PeopleManagement.tsx`

**New Component:** `src/components/ui/autocomplete-input.tsx`

**Features:**
- Text input with dropdown suggestions
- Filters suggestions as user types
- Shows matching names from database
- Allows selecting from list OR typing a new name
- Auto-fills related data (e.g., office when adjuster selected)

**Implementation Details:**
- Use `cmdk` (already installed) for the combobox behavior
- Fetch adjusters and salespeople lists
- Filter options based on input text
- Show suggestions in a dropdown below the input

---

## 6. Add New Person Confirmation Dialog

**New Component:** `src/components/ui/add-person-dialog.tsx`

**Behavior:**
When user types a name not in the existing list and tries to proceed:
1. Dialog appears asking: "'{Name}' is not in the system. Would you like to add them?"
2. Options:
   - "Add as Adjuster" - Opens quick form for office selection
   - "Add as Salesperson" - Opens quick form for role/email
   - "Just use this name" - Allows proceeding with just the text (no database entry)
   - "Cancel" - Go back to editing

**Integration Points:**
- `AddClientDealForm.tsx` - For adjuster field
- `EditSalesRecordDialog.tsx` - For both adjuster and salesperson fields
- The dialog only triggers when submitting the form with an unrecognized name

---

## Technical Implementation Details

### Files to Create:
1. `src/components/ui/autocomplete-input.tsx` - Reusable autocomplete component
2. `src/components/ui/add-person-dialog.tsx` - Confirmation dialog for new names

### Files to Modify:
1. `src/pages/AdjustersPage.tsx` - Add search box
2. `src/pages/SalesDashboardPage.tsx` - Clickable rows, fix decimals
3. `src/pages/SalespersonDashboardPage.tsx` - Handle deal query param
4. `src/components/salesperson/CommissionEstimator.tsx` - Accept highlight prop
5. `src/components/salesperson/DealCard.tsx` - Office display improvements
6. `src/components/salesperson/AddClientDealForm.tsx` - Replace Select with Autocomplete
7. `src/components/dashboard/EditSalesRecordDialog.tsx` - Replace Select with Autocomplete

### Component Structure for Autocomplete:

```text
AutocompleteInput
+-- Input field (text input)
+-- Suggestions dropdown (filtered list)
    +-- Suggestion items (clickable)
    +-- "Add new..." option (when no match)
```

### Navigation Flow for Deal Click:

```text
Sales Dashboard (Commission Details table)
  |-- User clicks row
  |-- Navigate to /sales/person/{salesperson_id}?deal={commission_id}
  |
Salesperson Dashboard
  |-- Read ?deal param
  |-- Switch to Commissions tab
  |-- Scroll to matching DealCard
  |-- Apply highlight styling
```

---

## Estimated Changes

| Area | Complexity | Files |
|------|------------|-------|
| Search box | Low | 1 file |
| Clickable deals | Medium | 3 files |
| Decimal fix | Low | 1 file |
| Office display | Low | 1 file |
| Autocomplete | High | 3-4 files + new component |
| Add person dialog | Medium | 1 new component + integrations |

