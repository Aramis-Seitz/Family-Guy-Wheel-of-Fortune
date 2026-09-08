import { createServerClient, parseCookieHeader, serializeCookieHeader, type CookieMethodsServer } from '@supabase/ssr';
import { next } from '@vercel/functions';

function getExpectedConfig(): { url: string; key: string } | undefined {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return undefined;
    return { url, key };
}

export async function requireSessionVercel(request: Request, redirectTo: string): Promise<Response | undefined> {
    const config = getExpectedConfig();
    if (!config) return undefined;

    const responseCookies: string[] = [];

    const cookieMethods: CookieMethodsServer = {
        getAll: () =>
            parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
        setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
                responseCookies.push(serializeCookieHeader(name, value, options));
            });
        },
    };

    const supabase = createServerClient(config.url, config.key, { cookies: cookieMethods });

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        if (responseCookies.length === 0) return undefined;

        const headers = new Headers();
        responseCookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
        return next({ headers });
    }

    const redirectUrl = new URL(redirectTo, request.url);
    const response = new Response(null, { status: 307, headers: { Location: redirectUrl.toString() } });
    responseCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
    return response;
}
