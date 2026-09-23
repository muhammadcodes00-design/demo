import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/data";
import { verifyPassword, createToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = getUser(email.toLowerCase().trim());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createToken({ email: user.email, name: user.name });
    const res = NextResponse.json({ success: true, user: { email: user.email, name: user.name } });
    res.cookies.set("invortech_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
