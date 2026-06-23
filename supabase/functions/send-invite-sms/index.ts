import { corsHeaders } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_MESSAGING_SERVICE_SID = Deno.env.get(
  "TWILIO_MESSAGING_SERVICE_SID"
);
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  try {
    // Validate environment variables
    if (
      !TWILIO_ACCOUNT_SID ||
      !TWILIO_AUTH_TOKEN ||
      !TWILIO_MESSAGING_SERVICE_SID
    ) {
      console.error("Missing Twilio env vars");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details:
            "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGING_SERVICE_SID must be set",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          details: "Request body must be JSON",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const { phone_number, invite_code, inviter_name } = body ?? {};
    // Validate input
    if (!phone_number || !invite_code) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          details: "phone_number and invite_code are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Basic E.164 validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone_number)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid phone number format. Must be E.164 (e.g., +1234567890)",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Compose message
    const message = inviter_name
      ? `${inviter_name} invited you to join TinyPlanet! Use code: ${invite_code}\n\nDownload the app to get started.`
      : `You've been invited to join TinyPlanet! Use code: ${invite_code}\n\nDownload the app to get started.`;
    // Send SMS via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(TWILIO_ACCOUNT_SID)}/Messages.json`;
    const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const form = new URLSearchParams();
    form.append("To", phone_number);
    form.append("MessagingServiceSid", TWILIO_MESSAGING_SERVICE_SID);
    form.append("Body", message);
    const twilioResp = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    let twilioData = null;
    try {
      twilioData = await twilioResp.json();
      console.log("twilioData:", twilioData);
    } catch (e) {
      console.error("Failed to parse Twilio response:", e);
    }
    if (!twilioResp.ok) {
      console.error("Twilio error:", twilioData ?? (await twilioResp.text()));
      return new Response(
        JSON.stringify({
          error: "Failed to send SMS",
          details:
            twilioData?.error_message ??
            twilioData?.message ??
            "Twilio returned an error",
        }),
        {
          status: twilioResp.status || 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Invite code sent successfully",
        messageSid: twilioData?.sid,
        status: twilioData?.status,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      }
    );
  } catch (err) {
    console.error("Unexpected error in send-invite-sms function:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
