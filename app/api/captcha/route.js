// app/api/captcha/route.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

const ITEMS = [
  { value: "coffee", label: "Coffee Cup" },
  { value: "laptop", label: "Laptop" },
  { value: "beer", label: "Beer Mug" },
  { value: "pizza", label: "Pizza Slice" },
  { value: "phone", label: "Smartphone" },
  { value: "game", label: "Gamepad" },
];

export async function GET() {
  // Select a random item to be the target
  const randomIndex = Math.floor(Math.random() * ITEMS.length);
  const targetItem = ITEMS[randomIndex];

  // Shuffle items for the client options
  const options = [...ITEMS].sort(() => Math.random() - 0.5);

  // Hash the target value so it cannot be read directly from the JWT payload
  const answerHash = crypto.createHash("sha256").update(targetItem.value).digest("hex");

  // Create a JWT expiring in 10 minutes containing the answer hash
  const jwtSecret = process.env.JWT_SECRET || "fallback-secret-for-dev";
  const token = jwt.sign(
    {
      answerHash,
    },
    jwtSecret,
    { expiresIn: "10m" }
  );

  return Response.json({
    targetLabel: targetItem.label,
    options,
    captchaToken: token,
  });
}
