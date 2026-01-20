# K2 Demo Project

## Project Brief

This project is a **prototype demo** for *K2*, a middleware product that acts as a **real-time commerce negotiator** between AI shopping agents and merchants.

The demo illustrates how merchants can sell through **agentic shopping experiences** using the Universal Commerce Protocol (UCP), and how K2 improves competitiveness **without using discounts**, instead protecting margins through non-price levers such as bundling and delivery promises.

The output of this project is a **single, shareable web URL** that can be used in customer and partner demos.

---

## Universal Commerce Protocol (UCP) Research

### Overview
UCP is an open-source standard by Google (with Shopify, Stripe, Visa, etc.) that enables AI agents to discover merchants and complete purchases programmatically. It's transport-agnostic (REST, MCP, A2A) and uses a composable capability architecture.

### Discovery Profile (`/.well-known/ucp`)
Merchants publish capabilities at this endpoint. Returns:
- `ucp.version` - Protocol version (YYYY-MM-DD format)
- `services` - Available transports (REST, MCP, A2A)
- `capabilities[]` - Named features like `dev.ucp.shopping.checkout`
- `payment.handlers[]` - Payment processor definitions
- `signing_keys[]` - JWK keys for signature verification

### Checkout Session Lifecycle
**States:**
1. `incomplete` - Session created, missing required info
2. `requires_escalation` - Needs human intervention (continue_url required)
3. `ready_for_complete` - Ready for payment/completion
4. `complete_in_progress` - Payment processing
5. `completed` - Order placed successfully
6. `canceled` - Session canceled

**Endpoints:**
- `POST /checkout-sessions` - Create session
- `PUT /checkout-sessions/{id}` - Update session
- `POST /checkout-sessions/{id}/complete` - Complete checkout

### Checkout Create Request Schema
Required fields:
- `line_items[]` - Array of items with product, quantity, price
- `currency` - ISO 4217 code (e.g., "USD")
- `payment` - Payment handler configuration

Optional:
- `buyer` - Buyer info (name, email, address)

### Checkout Response Schema
Required fields:
- `id` - Unique session identifier
- `ucp` - Protocol metadata
- `line_items[]` - Items in checkout
- `status` - Current lifecycle state
- `currency` - ISO 4217 code
- `totals[]` - Cart totals (subtotal, tax, total)
- `links[]` - Legal compliance links (terms, privacy)
- `payment` - Payment configuration

Optional:
- `buyer` - Buyer info
- `messages[]` - Status notifications/errors
- `expires_at` - Session expiration (default 6h)
- `continue_url` - Required when status is `requires_escalation`
- `order` - Order confirmation after completion

### Standard Headers
- `UCP-Agent` - Agent profile URL
- `request-signature` - Request authentication
- `idempotency-key` - Duplicate prevention UUID
- `request-id` - Request tracking UUID

### Extensions (Optional)
- Fulfillment - Shipping options and tracking
- Discount - Promo codes and discounts
- Buyer Consent - Marketing opt-ins

---

## Merchant API Implementation

### Implemented Endpoints
1. `GET /.well-known/ucp` - UCP discovery profile (returns merchant info, capabilities)
2. `GET /api/products` - Product catalog with search (`?q=`, `?limit=`, `?include_oos=1`)
3. `POST /api/checkout-sessions` - Create checkout session from product IDs and quantities
4. `GET /api/checkout-sessions/{id}` - Get session (auto-flips to `completed` when ready)
5. `PATCH /api/checkout-sessions/{id}` - Update session with customer email and shipping address
6. `POST /api/checkout-sessions/{id}/complete` - Start checkout completion (requires `payment_method: "mada"`)

### Checkout Flow
1. `POST /checkout-sessions` → status: `incomplete`
2. `PATCH /checkout-sessions/{id}` with email + address → status: `ready_for_complete`
3. `POST /checkout-sessions/{id}/complete` with payment → status: `complete_in_progress`
4. `GET /checkout-sessions/{id}` (poll after 5s) → status: `completed`

### Project Structure
```
lib/
  ucpProfile.ts              # UCP manifest builder
  checkoutSessionStore.ts    # In-memory session storage with types
  data/jarir-catalog.json    # Product catalog (12 items)
  demoLogs/
    types.ts                 # Event schema (DemoLogEvent, LogCategory)
    logBus.ts                # In-memory pub/sub logging bus
app/
  page.tsx                   # Home page with split-screen layout
  .well-known/ucp/route.ts                    # Discovery endpoint
  api/products/route.ts                       # Product search endpoint
  api/checkout-sessions/route.ts              # Checkout session creation
  api/checkout-sessions/[id]/route.ts         # GET and PATCH session
  api/checkout-sessions/[id]/complete/route.ts # Complete checkout
components/
  TerminalLogs.tsx           # Live terminal-style log viewer
  MobileAgentView.tsx        # Mobile phone mockup for agent UI
  DemoControlBar.tsx         # Demo buttons to emit sample events
```

### Simplifications for Demo
- No signature verification (skip `request-signature` validation)
- Mock payment handling (auto-approve)
- In-memory storage (no production DB)
- Static product catalog (JSON file)

---

## Demo Logging System

### Event Schema (`lib/demoLogs/types.ts`)
Defines the type system for demo logging events:

**Log Categories:**
- `ui` - User actions and client orchestration
- `agent` - AI shopping agent actions
- `k2` - K2 middleware reasoning/negotiation
- `merchant` - Merchant API requests/responses
- `checkout` - Checkout session lifecycle
- `payment` - Mada payment flow and order confirmation
- `system` - System-level events (init, errors)

**DemoLogEvent Structure:**
- `id` - Unique identifier
- `timestamp` - ISO 8601 timestamp
- `category` - LogCategory enum
- `event` - Event name (e.g., "checkout.complete.request")
- `message` - Human-readable description
- `session_id` - Optional checkout session ID
- `payload` - Arbitrary JSON data
- `level` - debug, info, warn, error

### Logging Bus (`lib/demoLogs/logBus.ts`)
In-memory pub/sub event bus for log collection:

- `emitLog(params)` - Emit a new log event
- `subscribeLogs(listener)` - Subscribe to live events (returns unsubscribe fn)
- `getLogSnapshot()` - Get all buffered logs
- `clearLogs()` - Clear all logs
- Maintains circular buffer of 250 events max

---

## UI Components

### Split-Screen Layout (`app/page.tsx`)
```
┌─────────────────────────────────────────┐
│        DemoControlBar (top)             │
├──────────────┬──────────────────────────┤
│              │                          │
│ MobileAgent  │   TerminalLogs (live)    │
│  View (50%)  │   (50%)                  │
│              │                          │
└──────────────┴──────────────────────────┘
```

### TerminalLogs (`components/TerminalLogs.tsx`)
Live terminal-style log viewer:
- Subscribes to logBus for real-time updates
- Color-coded by category and severity level
- Expandable JSON payloads
- Auto-scrolls to latest entry
- Clear button and event count display

### MobileAgentView (`components/MobileAgentView.tsx`)
Mobile phone mockup (375x700px) for the K2 shopping agent:
- Phone frame with notch design
- Header, chat area placeholder, input field
- Visual context for the agent experience

### DemoControlBar (`components/DemoControlBar.tsx`)
Control panel with buttons to emit sample events:
- Agent Event, Merchant Req/Res, K2 Reasoning
- Checkout, Payment, Clear Logs
- Demonstrates logging system without live integration
