import { randomInt } from "node:crypto";
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
  try {
    const ranNum = getSecureRandomNumber(360, 900);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(200).json({
        ranNum,
        spinToken: "",
      });
    }

    const authHeader = req.headers["authorization"] ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!jwt) {
      return res.status(200).json({
        ranNum,
        spinToken: "",
      });
    }

    const supabase = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Invalid Supabase session:", authError);

      return res.status(401).json({
        error: "Invalid session",
        message: authError?.message,
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
      console.error("Failed to create spin token:", {
        message: tokenError?.message,
        details: tokenError?.details,
        hint: tokenError?.hint,
        code: tokenError?.code,
      });

      return res.status(500).json({
        error: "Failed to create spin token",
        message: tokenError?.message,
        details: tokenError?.details,
        hint: tokenError?.hint,
        code: tokenError?.code,
      });
    }

    return res.status(200).json({
      ranNum,
      spinToken: tokenData.token,
    });
  } catch (error) {
    console.error("Random API failed:", {
      message: error?.message,
      stack: error?.stack,
    });

    return res.status(500).json({
      error: "Failed to generate number",
      message: error?.message,
    });
  }
}