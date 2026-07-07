import { requireBasicAuthVercel } from './server/src/lib/basic-auth';

export const config = {
    matcher: ['/login.html', '/main.html', '/signup.html'],
};

export default function middleware(request: Request) {
    return requireBasicAuthVercel(request);
}
