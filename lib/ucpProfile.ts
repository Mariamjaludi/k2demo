import { NextRequest } from "next/server";

export function buildUcpProfile(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";

  const baseUrl = `${protocol}://${host}`;

  return {
    ucp: {
      version: "2025-04-01"
    },
    merchant: {
      id: "jarir",
      name: "Jarir"
    },
    services: {
      rest: {
        endpoint: baseUrl
      }
    },
    capabilities: [
      {
        name: "ucp.shopping.product_catalog",
        version: "2025-04-01",
        config: {
          endpoint: `${baseUrl}/api/products`,
          search_param: "q",
          max_results: 20
        }
      },
      {
        name: "ucp.shopping.checkout",
        version: "2025-04-01",
        config: {
          endpoint: `${baseUrl}/api/checkout-sessions`,
          supported_currencies: ["SAR"],
          vat_rate: 0.15
        }
      }
    ]
  };
}
