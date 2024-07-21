import type { APIRoute } from 'astro';
const relevantParams = ['coreplugins', 'html', 'script', 'ts', 'tw', 'v'];
export const GET: APIRoute = async ({ request, locals }) => {
  const params = new URL(request.url).searchParams;
  const result = btoa(
    Array.prototype.map
      .call(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(
              relevantParams
                .filter((param) => params.has(param))
                .map((param) => params.get(param))
                .join(''),
            ),
          ),
        ),
        (num) => String.fromCharCode(num),
      )
      .join(''),
  )
    .slice(0, 12)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  const shareKV = locals.runtime.env.PLAY_SHARE;
  await shareKV.put(
    result,
    new URLSearchParams(
      [...params.entries()].filter(([key]) => relevantParams.includes(key)),
    ).toString(),
  );
  return new Response(result, {
    status: 200,
    headers: new Headers({
      'content-type': 'application/json',
    }),
  });
};
