import { randomInt, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function getSecureRandomNumber(min, max) {
  return randomInt(min, max + 1);
}

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ranNum = getSecureRandomNumber(360, 900);
    const { names } = req.body ?? {};
    const nameList = Array.isArray(names) && names.length > 0 ? names : [];
    const winnerName = nameList.length > 0 ? nameList[ranNum % nameList.length] : "";

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(200).json({ ranNum, spinToken: "", winnerName });
    }

    const authHeader = req.headers["authorization"] ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!jwt) {
      return res.status(200).json({ ranNum, spinToken: "", winnerName });
    }

    const supabase = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return res.status(401).json({
        error: "Invalid session",
        message: authError?.message,
      });
    }

    const spinToken = randomUUID();

    const { data: tokenData, error: tokenError } = await supabase
      .from("spin_tokens")
      .insert({
        token: spinToken,
        user_id: user.id,
        used: false,
        winner_name: winnerName,
      })
      .select("token")
      .single();

    if (tokenError || !tokenData) {
      return res.status(500).json({
        error: "Failed to create spin token",
        message: tokenError?.message,
      });
    }

    return res.status(200).json({ ranNum, spinToken: tokenData.token, winnerName });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate number",
      message: error?.message,
    });
  }
}
