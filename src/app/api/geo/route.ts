// Country comes from the hosting platform's edge headers (Vercel or Cloudflare), so no third-party IP lookup.
export function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "";
  return Response.json(
    { country: /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : "" },
    { headers: { "cache-control": "no-store" } },
  );
}
