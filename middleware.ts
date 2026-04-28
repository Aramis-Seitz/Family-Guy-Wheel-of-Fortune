export const config = {
  matcher: ['/login.html', '/main.html', '/signup.html'],
};
declare const process: {
  env: {
    AUTH_SECRET: string;
  };
};
export default function middleware(request: Request) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('cookie') ?? '';
  const expected = process.env.AUTH_SECRET;

  const match = cookieHeader.match(/(?:^|;\s*)basic_auth=([^;]+)/);
  const cookieValue = match?.[1];

  if (cookieValue !== expected) {
    return Response.redirect(new URL('/index.html', url), 302);
  }

  return;
}