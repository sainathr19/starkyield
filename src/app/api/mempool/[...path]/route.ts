import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "http://localhost:3000",
  "https://onesat.vercel.app"
];

function startsWithAny(urlString: string, prefix: string) {
  return ALLOWED_DOMAINS.some((domain) =>
    urlString.startsWith(`${domain}${prefix}`)
  );
}

function endsWith(urlString: string, suffix: string) {
  return urlString.endsWith(suffix);
}

function fullUrlEquals(urlString: string, suffix: string) {
  return ALLOWED_DOMAINS.some((domain) =>
    urlString === `${domain}${suffix}`
  );
}

function matchAnyDomain(urlString: string, pathPattern: RegExp) {
  for (const domain of ALLOWED_DOMAINS) {
    const reg = new RegExp("^" + domain.replace(/\//g, "\\/") + pathPattern.source);
    const match = urlString.match(reg);
    if (match) {
      // Add domain as match[0]
      return [domain, ...match.slice(1)];
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Handle special case: <domain>/api/mempool/testnet4/apiaddress/<addr>/utxo (missing slash in "api/address")
  if (
    startsWithAny(request.url, "/api/mempool/testnet4/apiaddress/") &&
    endsWith(request.url, "/utxo")
  ) {
    // Extract the Bitcoin address
    // Pattern: .../apiaddress/<address>/utxo
    const matches = request.url.match(/apiaddress\/([^/]+)\/utxo/);
    if (matches && matches[1]) {
      const address = matches[1];

      const fixedUrlBase = ALLOWED_DOMAINS.find(d => request.url.startsWith(d))!;
      const fixedUrl = `${fixedUrlBase}/api/mempool/testnet4/api/address/${address}/utxo`;
      // Proxy the corrected request
      const resp = await fetch(fixedUrl, { cache: "no-store" });
      const contentType =
        resp.headers.get("Content-Type") || "application/json";
      const body = await resp.arrayBuffer();
      return new NextResponse(body, {
        status: resp.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  }

  // Hardcoded special case for "<domain>/api/mempool/testnet4/apiv1/fees/recommended"
  if (
    fullUrlEquals(request.url, "/api/mempool/testnet4/apiv1/fees/recommended")
  ) {
    const specialUrlBase = ALLOWED_DOMAINS.find(d => request.url.startsWith(d))!;
    const specialUrl =
      `${specialUrlBase}/api/mempool/testnet4/api/v1/fees/recommended`;
    const resp = await fetch(specialUrl, { cache: "no-store" });
    const contentType = resp.headers.get("Content-Type") || "application/json";
    const body = await resp.arrayBuffer();
    return new NextResponse(body, {
      status: resp.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Hardcoded special case for "<domain>/api/mempool/testnet4/apiv1/cpfp/<txid>"
  // Support both domains by matching with any domain prefix
  // Pattern: <domain>/api/mempool/testnet4/apiv1/cpfp/<txid>
  // txid is 64 chars [a-f0-9]
  const cpfpMatch = matchAnyDomain(request.url,
    /\/api\/mempool\/testnet4\/apiv1\/cpfp\/([a-f0-9]{64})(\?.*)?$/
  );
  if (cpfpMatch) {
    const [domain, txid, query] = cpfpMatch;
    const q = query || "";
    const fixedUrl = `${domain}/api/mempool/testnet4/api/v1/cpfp/${txid}${q}`;
    const resp = await fetch(fixedUrl, { cache: "no-store" });
    const contentType = resp.headers.get("Content-Type") || "application/json";
    const body = await resp.arrayBuffer();
    return new NextResponse(body, {
      status: resp.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `https://mempool.space/${path}${
      searchParams ? `?${searchParams}` : ""
    }`;

    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "text/plain",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const contentType =
      upstream.headers.get("Content-Type") || "application/json";
    const bodyBuffer = await upstream.arrayBuffer();
    return new NextResponse(bodyBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error proxying mempool request:", error);
    return NextResponse.json(
      { error: "Failed to fetch from mempool" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
