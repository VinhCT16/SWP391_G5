# Quote Items Data Flow - Where Items Are Processed and Stored

## Overview
This document tracks where quote-related item data is processed and where it's stored in the database.

## Data Storage Location

### Primary Storage: `Request` Model
**File:** `server/models/Request.js` (lines 32-46)

Items are stored in the `Request` model under the `items` array field:

```javascript
items: [
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    category: { 
      type: String, 
      enum: ["furniture", "electronics", "clothing", "kitchen", "books", "other"],
      default: "other"
    },
    estimatedValue: Number,
    requiresSpecialHandling: { type: Boolean, default: false }
  }
]
```

**Note:** The actual implementation in `updateRequestItems` also stores additional fields:
- `dimensions`: { weight, length, width, height }
- `images`: Array of base64 image strings

## Quote-Related Pages/Functions

### 1. QuoteItemsPage (Frontend)
**File:** `client/src/pages/quote/QuoteItemsPage.jsx`

**Purpose:** UI for adding/editing items that need to be moved

**Item Format (Frontend):**
```javascript
{
  name: string,           // Item name/description
  weight: string,          // Weight in kg
  length: string,          // Length in cm
  width: string,           // Width in cm
  height: string,          // Height in cm
  images: array,           // Base64 encoded images (max 4)
  isApartment: boolean     // Flag for apartment/high floor
}
```

**Key Functions:**
- `addItem()` - Adds new item to list
- `removeItem(idx)` - Removes item at index
- `updateItem(idx, field, value)` - Updates item field
- `addImages(idx, files)` - Adds images to item (converts to base64)
- `handleNext()` - Saves items to request via `updateRequestItems()` API

**Flow:**
1. Customer/Staff enters items in this page
2. If `isStaffReview` flag is set → calls `updateRequestItems()` API to save directly to Request
3. Otherwise → passes items to next page (`/quote/service`) via navigation state

### 2. updateRequestItems API (Backend)
**File:** `server/controllers/requestController.js` (lines 838-912)

**Endpoint:** `PATCH /api/requests/:id/items`

**Purpose:** Saves items from QuoteItemsPage to the Request model

**Process:**
1. Validates request exists
2. Validates review task exists and staff is assigned
3. Converts QuoteItemsPage format to Request items format:
   ```javascript
   {
     itemId: new ObjectId(),
     description: item.name,
     quantity: 1,
     category: 'other',
     estimatedValue: null,
     requiresSpecialHandling: item.isApartment,
     dimensions: {
       weight: parseFloat(item.weight),
       length: parseFloat(item.length),
       width: parseFloat(item.width),
       height: parseFloat(item.height)
     },
     images: item.images
   }
   ```
4. Updates `request.items` array
5. Updates review task status to 'in-progress' if needed
6. Saves request to database

### 3. QuoteServicePage
**File:** `client/src/pages/quote/QuoteServicePage.jsx`

**Purpose:** Selects service options (vehicle type, helpers, extras)

**Note:** Items are passed via navigation state but not modified here

### 4. QuotePrice Calculation
**File:** `server/src/services/quotePrice.js` (lines 76-85)

**Purpose:** Calculates pricing based on items

**Item Processing:**
```javascript
// Calculates item fee based on volume
let itemFee = 0;
if (items && items.length > 0) {
  itemFee = items.reduce((sum, it) => {
    if (it.length && it.width && it.height) {
      const vol = (parseFloat(it.length) * parseFloat(it.width) * parseFloat(it.height)) / 1000000; // m³
      return sum + vol * 50000; // 50k VND/m³
    }
    return sum;
  }, 0);
}
```

**Note:** Uses `length`, `width`, `height` from items to calculate volume-based pricing

### 5. Quote API Routes
**File:** `server/src/routes/quotes.js`

**Endpoints:**
- `POST /api/quotes/estimate` - Estimates quote price (uses items for calculation)
- `POST /api/quotes` - Saves quote (but items are stored in Request, not Quote model)

**Note:** The `Quote` model (`server/src/models/Quote.js`) does NOT store items. Items are always stored in the `Request` model.

## Data Flow Summary

### Customer Flow:
1. Customer creates request → `CreateRequestPage.jsx`
2. Customer adds items → `QuoteItemsPage.jsx`
3. Items passed via state → `QuoteServicePage.jsx` → `QuoteSummaryPage.jsx`
4. Items used for price calculation → `quotePrice.js`
5. Items saved to Request when request is created/updated

### Staff Review Flow:
1. Staff picks Review task → `TaskListTab.jsx` or `MyTasksTab.jsx`
2. Staff clicks "List Items" → navigates to `QuoteItemsPage.jsx` with `isStaffReview: true`
3. Staff enters items → clicks "Lưu danh sách đồ dùng"
4. Items saved directly → `updateRequestItems()` API → stored in `Request.items`

## Key API Functions

### Frontend (`client/src/api/requestApi.js`):
- `updateRequestItems(requestId, items, taskId)` - Saves items to request (line 140-148)

### Backend (`server/controllers/requestController.js`):
- `updateRequestItems()` - Processes and saves items (line 838-912)

## Database Schema

**Collection:** `requests`
**Field:** `items` (array of item objects)

**Stored Format:**
```javascript
{
  itemId: ObjectId,
  description: String,        // Item name
  quantity: Number,           // Usually 1
  category: String,           // "furniture", "electronics", etc.
  estimatedValue: Number,     // Optional
  requiresSpecialHandling: Boolean,
  dimensions: {               // Additional fields (stored but not in schema)
    weight: Number,
    length: Number,
    width: Number,
    height: Number
  },
  images: [String]           // Base64 images (stored but not in schema)
}
```

## Important Notes

1. **Items are stored in Request model, NOT Quote model**
2. **Quote model** only stores pricing/configuration, not item details
3. **Items can be added/updated** by both customers (during request creation) and staff (during review)
4. **Images are stored as base64 strings** in the items array
5. **Dimensions are stored** in a `dimensions` sub-object (not in the original schema but added by `updateRequestItems`)

