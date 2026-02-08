import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const MASTER_PASSWORD = process.env.MASTER_PASSWORD;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (password === MASTER_PASSWORD) {
      const token = jwt.sign(
        {
          authenticated: true,
          timestamp: Date.now(),
        },
        JWT_SECRET as string,
        { expiresIn: "24h" }
      );

      return Response.json({
        success: true,
        token,
        message: "Login erfolgreich",
      });
    } else {
      return Response.json(
        {
          success: false,
          message: "Falsches Passwort",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      {
        success: false,
        message: "Server-Fehler",
      },
      { status: 500 }
    );
  }
}
