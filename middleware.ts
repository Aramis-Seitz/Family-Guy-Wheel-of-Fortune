export const config = {
    matcher: ['/login.html', '/main.html', '/signup.html'],
};

declare const process: {
    env: {
        AUTH_USER: string;
        AUTH_PWD: string;
    };
};

export default function middleware(request: Request) {
    const validUser = process.env.AUTH_USER;
    const validPwd = process.env.AUTH_PWD;

    if (!validUser || !validPwd) return;

    const header = request.headers.get('authorization') ?? '';
    const b64 = header.replace(/^Basic\s+/i, '');

    if (b64) {
        const decoded = atob(b64);
        const colonIndex = decoded.indexOf(':');
        const inputUser = decoded.slice(0, colonIndex);
        const inputPwd = decoded.slice(colonIndex + 1);
        if (inputUser === validUser && inputPwd === validPwd) return;
    }

    return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Wheeel"' },
    });
}