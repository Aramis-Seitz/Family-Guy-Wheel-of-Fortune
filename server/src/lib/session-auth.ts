import { createServerClient, parseCookieHeader, serializeCookieHeader, type CookieMethodsServer } from '@supabase/ssr';
import { next } from '@vercel/functions';

function getExpectedConfig(): { url: string; key: string } | undefined {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return undefined;
    return { url, key };
}

// Prueft die Supabase-Session anhand des vom Browser gesendeten Cookies und
// liefert bei fehlender/ungueltiger Session einen Redirect auf `redirectTo`,
// der VOR Auslieferung der geschuetzten Seite greift (Edge Middleware).
export async function requireSessionVercel(request: Request, redirectTo: string): Promise<Response | undefined> {
    const config = getExpectedConfig();
    // Keine Zugangsdaten konfiguriert (z.B. lokale Entwicklung) -> nicht schuetzen.
    if (!config) return undefined;

    const responseCookies: string[] = [];

    // Server hat kein document.cookie -> Supabase braucht diesen Adapter zum Lesen/Schreiben.
    const cookieMethods: CookieMethodsServer = {
        getAll: () =>
            parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
        // Nur sammeln, da wir hier kein Response-Objekt zum Schreiben haben (s.u.).
        setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
                responseCookies.push(serializeCookieHeader(name, value, options));
            });
        },
    };

    const supabase = createServerClient(config.url, config.key, { cookies: cookieMethods });

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Kein erneuertes Cookie zu uebertragen -> Anfrage unveraendert durchlassen.
        if (responseCookies.length === 0) return undefined;

        // Waehrend der Pruefung wurde der Token erneuert (z.B. Access-Token war abgelaufen).
        // next() laesst main.html normal ausliefern, haengt das erneuerte Cookie aber
        // trotzdem an die finale Antwort - anders als ein einfaches `return undefined`.
        const headers = new Headers();
        responseCookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
        return next({ headers });
    }

    const redirectUrl = new URL(redirectTo, request.url);
    // Response.redirect() liefert immutable Headers (kein Set-Cookie moeglich) -> Response manuell bauen.
    // 307 -> "Temporary Redirect"
    const response = new Response(null, { status: 307, headers: { Location: redirectUrl.toString() } });
    // Letzten bekannten Cookie-Stand trotzdem mitgeben (z.B. Refresh gelang, User war danach trotzdem ungueltig).
    responseCookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
    return response;
}
