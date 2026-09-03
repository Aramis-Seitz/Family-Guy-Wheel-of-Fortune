import { beforeEach, describe, expect, it } from "vitest";
import { store } from "../mock/store";

describe("username + suffix uniqueness", () => {
  beforeEach(() => {
    store.profiles = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        username: "admin",
        suffix: 0,
        email: "admin@admin.de",
        date_of_birth: null,
        password: "admin",
        coins: 0,
      },
    ];
  });

  it("allows the same username as long as the suffix differs", async () => {
    store.profiles.push(
      {
        id: "user-1",
        username: "alice",
        suffix: 0,
        email: "alice@example.com",
        date_of_birth: null,
        password: "",
        coins: 0,
      },
      {
        id: "user-2",
        username: "alice",
        suffix: 1,
        email: "alice2@example.com",
        date_of_birth: null,
        password: "",
        coins: 0,
      },
    );
  });
});
