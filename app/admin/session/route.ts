import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminAuthConfigured,
  validateAdminPassword,
} from "../../server/adminAuth";

export async function POST(request: Request) {
  const formData = await request.formData();

  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?setup=missing", request.url), {
      status: 303,
    });
  }

  if (!validateAdminPassword(formData.get("password"))) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), {
      status: 303,
    });
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 303 });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), adminSessionCookieOptions());
  return response;
}
