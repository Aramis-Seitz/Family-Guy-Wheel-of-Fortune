import { requireBasicAuthVercel } from './server/src/lib/basic-auth';
import { requireSessionVercel } from './server/src/lib/session-auth';

export const config = {
    matcher: ['/login.html', '/main.html', '/signup.html'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
    const basicAuthResponse = requireBasicAuthVercel(request);
    if (basicAuthResponse) return basicAuthResponse;

    const { pathname } = new URL(request.url);
    if (pathname === '/main.html') {
        return requireSessionVercel(request, '/login.html');
    }

    return undefined;
}
