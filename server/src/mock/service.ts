import { decodeMockJwt } from "./routes";
import { findProfile } from "./store";


export function createMockServiceClient() {
  return {
    auth: {
      async getUser(jwt: string) {
        const decoded = decodeMockJwt(jwt);
        if (!decoded) return { data: { user: null }, error: { message: "Invalid mock token" } };
        const profile = findProfile(decoded.id);
        if (!profile) return { data: { user: null }, error: { message: "User not found" } };
        return {
          data: {
            user: {
              id: decoded.id,
              email: decoded.email,
              user_metadata: { username: decoded.username, suffix: profile.suffix, date_of_birth: profile.date_of_birth },
            },
          },
          error: null,
        };
      },
    },
  };
}
