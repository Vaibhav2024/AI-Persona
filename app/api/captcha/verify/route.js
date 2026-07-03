// app/api/captcha/verify/route.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { captchaToken, answer } = await req.json();

    if (!captchaToken || !answer) {
      return Response.json(
        { error: "Captcha token and answer are required." },
        { status: 400 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-for-dev";

    // Verify original captcha token
    let decoded;
    try {
      decoded = jwt.verify(captchaToken, jwtSecret);
    } catch (err) {
      return Response.json(
        { error: "Invalid or expired captcha token. Please refresh." },
        { status: 400 }
      );
    }

    const { answerHash } = decoded;

    // Hash the user's input answer and compare
    const cleanUserAnswer = answer.toLowerCase().trim();
    const userHash = crypto.createHash("sha256").update(cleanUserAnswer).digest("hex");

    if (userHash !== answerHash) {
      return Response.json(
        { error: "Incorrect answer. Please try again." },
        { status: 400 }
      );
    }

    // Generate session token valid for 2 hours
    const sessionToken = jwt.sign(
      { captchaSolved: true },
      jwtSecret,
      { expiresIn: "2h" }
    );

    return Response.json({ success: true, sessionToken });
  } catch (error) {
    console.error("Captcha verification error:", error);
    return Response.json(
      { error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
