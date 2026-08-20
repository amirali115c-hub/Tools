export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Get target URL from query parameter
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing ?url= parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Block private IPs (security)
    const hostname = new URL(targetUrl).hostname;
    if (isPrivateIP(hostname)) {
      return new Response(
        JSON.stringify({ error: 'Private IPs not allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ClienvoraBot/1.0; +https://clienvora.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });

      // Clone response to modify headers
      const modifiedResponse = new Response(response.body, response);

      // Add CORS headers
      const headers = corsHeaders();
      headers.forEach((value, key) => {
        modifiedResponse.headers.set(key, value);
      });

      // Cache for 5 minutes
      modifiedResponse.headers.set('Cache-Control', 'public, max-age=300');

      return modifiedResponse;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch: ${error.message}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }
  },
};

function corsHeaders() {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  });
}

function isPrivateIP(hostname) {
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^localhost$/i,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];
  return privatePatterns.some((pattern) => pattern.test(hostname));
}
