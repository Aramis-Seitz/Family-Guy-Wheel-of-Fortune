import { getSecureRandomNumber } from "./dist/utils/random.js";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function handler(req, res) {
  const ranNum = getSecureRandomNumber(360, 900);

  // Wenn Supabase-Server-Variablen fehlen:
  // Spin funktioniert trotzdem, aber ohne Token/Coins.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({
      ranNum,
      spinToken: "",
    });
  }

  const authHeader = req.headers["authorization"] ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

  // Wenn User nicht eingeloggt ist:
  // Spin funktioniert trotzdem, aber ohne Token/Coins.
  if (!jwt) {
    return res.status(200).json({
      ranNum,
      spinToken: "",
    });
  }

  try {
    const supabase = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return res.status(401).json({
        error: "Invalid session",
      });
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("spin_tokens")
      .insert({
        user_id: user.id,
      })
      .select("token")
      .single();

    if (tokenError || !tokenData) {
      console.error("Failed to create spin token:", tokenError);
      return res.status(500).json({
        error: "Failed to create spin token",
      });
    }

    return res.status(200).json({
      ranNum,
      spinToken: tokenData.token,
    });
  } catch (error) {
    console.error("Random API failed:", error);
    return res.status(500).json({
      error: "Failed to generate number",
    });
  }
}