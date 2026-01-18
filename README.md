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
      "name": "dev.ucp.shopping.product_catalog",
      "version": "2025-04-01",
      "config": {
        "endpoint": "http://localhost:3000/api/products",
        "search_param": "q",
        "max_results": 20
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
