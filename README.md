# K2 Demo

A prototype demo for **K2**, a middleware product that acts as a real-time commerce negotiator between AI shopping agents and merchants.

The demo illustrates how merchants can sell through agentic shopping experiences using the Universal Commerce Protocol (UCP), and how K2 improves competitiveness without using discounts, instead protecting margins through non-price levers such as bundling and delivery promises.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## API Endpoints

### Discovery

#### `GET /.well-known/ucp`

Returns the UCP discovery manifest for the merchant (Jarir). AI agents call this first to learn what capabilities are supported.

**Response:**
**Note:** The URLs in this example show `localhost:3000` for local development. In production, these should be dynamically generated based on your deployment environment.

```json
{
  "ucp": { "version": "2025-04-01" },
  "merchant": { "id": "jarir", "name": "Jarir" },
  "services": { "rest": { "endpoint": "http://localhost:3000" } },
  "capabilities": [
    {
      "name": "ucp.shopping.product_catalog",
      "version": "2025-04-01",
      "config": {
        "endpoint": "http://localhost:3000/api/products",
        "search_param": "q",
        "max_results": 20
      }
    },
    {
      "name": "ucp.shopping.checkout",
      "version": "2025-04-01",
      "config": {
        "endpoint": "http://localhost:3000/api/checkout-sessions",
        "supported_currencies": ["SAR"],
        "vat_rate": 0.15
      }
    }
  ]
}
```

### Products

#### `GET /api/products`

Returns the product catalog. Supports search and pagination.

**Query Parameters:**
| Param | Description | Default |
|-------|-------------|---------|
| `q` | Search query (matches title, brand, category) | - |
| `limit` | Max results to return | 20 |
| `include_oos` | Include out-of-stock items (`1` to enable) | `0` |

**Response:**
```json
{
  "query": "paper",
  "count": 1,
  "items": [
    {
      "id": "jarir_a4_copy_paper_500",
      "title": "Roco Premium Copy Paper A4 – 500 Sheets",
      "brand": "Roco",
      "category": "office_supplies",
      "price": 25,
      "currency": "SAR",
      "availability": { "in_stock": true, "stock_level": 120 },
      "delivery": { "default_promise": "Deliver tomorrow in Riyadh" }
    }
  ]
}
```

**Examples:**
```bash
# Get all products (up to 20)
curl http://localhost:3000/api/products

# Search for products
curl "http://localhost:3000/api/products?q=paper"

# Limit results
curl "http://localhost:3000/api/products?q=school&limit=5"
```

### Checkout

#### `POST /api/checkout-sessions`

Creates a new checkout session from a list of product IDs and quantities.

**Request Body:**
```json
{
  "items": [
    { "product_id": "jarir_a4_copy_paper_500", "quantity": 2 },
    { "product_id": "jarir_ballpoint_pen_blue_10", "quantity": 1 }
  ]
}
```

**Response (201):**
```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "incomplete",
    "currency": "SAR",
    "line_items": [
      {
        "product_id": "jarir_a4_copy_paper_500",
        "title": "Roco Premium Copy Paper A4 – 500 Sheets",
        "quantity": 2,
        "unit_price": 25,
        "total": 50
      }
    ],
    "customer": { "email": null },
    "shipping": { "address": null, "fee": 0 },
    "totals": {
      "subtotal": 50,
      "vat": 7.5,
      "vat_rate": 0.15,
      "total": 57.5
    },
    "delivery": { "promise": null, "eta_minutes": null },
    "created_at": "2025-01-18T12:00:00.000Z",
    "expires_at": "2025-01-18T18:00:00.000Z",
    "updated_at": "2025-01-18T12:00:00.000Z"
  },
  "missing_fields": ["customer.email", "shipping.address"]
}
```

**Features:**
- Aggregates duplicate product IDs
- Validates products exist and are in stock
- Calculates subtotal, 15% VAT, and total
- Sessions expire after 6 hours
- Returns `missing_fields` to indicate required data for completion

**Example:**
```bash
curl -X POST http://localhost:3000/api/checkout-sessions \
  -H "Content-Type: application/json" \
  -d '{"items": [{"product_id": "jarir_a4_copy_paper_500", "quantity": 2}]}'
```

#### `GET /api/checkout-sessions/{id}`

Retrieves a checkout session. Automatically flips status from `complete_in_progress` to `completed` when ready.

**Response:**
```json
{
  "session": { ... }
}
```

#### `PATCH /api/checkout-sessions/{id}`

Updates a checkout session with customer email and/or shipping address. Status changes to `ready_for_complete` when both are provided.

**Request Body:**
```json
{
  "customer": { "email": "customer@example.com" },
  "shipping": {
    "address": {
      "country": "SA",
      "city": "Riyadh",
      "address_line1": "123 Main Street"
    }
  }
}
```

**Shipping Rules:**
- Riyadh: 10 SAR shipping, "Deliver tomorrow in Riyadh"
- Other cities: 20 SAR shipping, "Deliver in 2-3 days"
- VAT (15%) applies to subtotal + shipping

**Example:**
```bash
curl -X PATCH http://localhost:3000/api/checkout-sessions/{id} \
  -H "Content-Type: application/json" \
  -d '{"customer":{"email":"test@example.com"},"shipping":{"address":{"country":"SA","city":"Riyadh","address_line1":"123 Main St"}}}'
```

#### `POST /api/checkout-sessions/{id}/complete`

Initiates checkout completion. Requires session to have email and address, and status must be `ready_for_complete`.

**Request Body:**
```json
{
  "payment_method": "mada"
}
```

**Response (202):**
```json
{
  "session": {
    "status": "complete_in_progress",
    "order": { "id": "ORD-A1B2C3D4", "created_at": "..." },
    "completion": { "started_at": "...", "ready_at": "..." }
  },
  "poll_url": "/api/checkout-sessions/{id}",
  "message": "Checkout completion in progress"
}
```

Poll `GET /api/checkout-sessions/{id}` after 5 seconds to see `status: "completed"`.

**Example:**
```bash
curl -X POST http://localhost:3000/api/checkout-sessions/{id}/complete \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "mada"}'
```

## Checkout Flow Summary

```
1. POST /api/checkout-sessions          → status: "incomplete"
2. PATCH /api/checkout-sessions/{id}    → status: "ready_for_complete"
3. POST /api/checkout-sessions/{id}/complete → status: "complete_in_progress"
4. GET /api/checkout-sessions/{id}      → status: "completed" (after 5s)
```

## Demo UI

The demo features a split-screen layout with a mobile agent mockup on the left and a live terminal log viewer on the right.

### Components

| Component | Description |
|-----------|-------------|
| `MobileAgentView` | Mobile phone mockup (375x700px) representing the K2 shopping agent chat interface |
| `TerminalLogs` | Live terminal-style log viewer with color-coded events and expandable JSON payloads |
| `DemoControlBar` | Control panel with buttons to emit sample events for demonstration |

### Logging System

The demo includes a client-side logging bus (`lib/demoLogs/`) for narrating system events in real-time:

**Log Categories:**
- `ui` - User actions
- `agent` - AI agent actions
- `k2` - K2 middleware reasoning
- `merchant` - API requests/responses
- `checkout` - Session lifecycle
- `payment` - Payment flow
- `system` - System events

**Usage:**
```typescript
import { emitLog, subscribeLogs } from '@/lib/demoLogs/logBus';

// Emit a log event
emitLog({
  category: 'agent',
  event: 'agent.search.start',
  message: 'Searching for products',
  payload: { query: 'school supplies' }
});

// Subscribe to live events
const unsubscribe = subscribeLogs((event) => {
  console.log(event);
});
```
