import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import dns from "dns/promises";

const verifySchema = z.object({
  email: z.string().email(),
});

// GET /api/email?email=test@example.com
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  try {
    verifySchema.parse({ email });
  } catch {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.credits <= 0) {
    return NextResponse.json(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }

  // Perform email verification
  const result = await verifyEmail(email!);

  // Save result and deduct credit
  await prisma.$transaction([
    prisma.emailVerification.create({
      data: {
        email: email!,
        status: result.status,
        score: result.score,
        isSyntaxOk: result.isSyntaxOk,
        isMxValid: result.isMxValid,
        isSmtpValid: result.isSmtpValid,
        isDisposable: result.isDisposable,
        isRoleEmail: result.isRoleEmail,
        details: result.details,
        userId: user.id,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1 } },
    }),
    prisma.creditLog.create({
      data: {
        userId: user.id,
        amount: -1,
        description: `Email verification: ${email}`,
      },
    }),
  ]);

  return NextResponse.json(result);
}

// POST /api/email — Send notification email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to, subject, message } = await req.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "to, subject, and message are required" },
        { status: 400 }
      );
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"EmailVerifier" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

async function verifyEmail(email: string) {
  const [localPart, domain] = email.split("@");

  // 1. Syntax check
  const isSyntaxOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isSyntaxOk) {
    return {
      email,
      status: "invalid",
      score: 0,
      isSyntaxOk: false,
      isMxValid: false,
      isSmtpValid: false,
      isDisposable: false,
      isRoleEmail: false,
      details: { reason: "Invalid email syntax" },
    };
  }

  // 2. MX record check
  let isMxValid = false;
  try {
    const mxRecords = await dns.resolveMx(domain);
    isMxValid = mxRecords.length > 0;
  } catch {
    isMxValid = false;
  }

  // 3. Disposable domain check (basic list)
  const disposableDomains = [
    "mailinator.com", "guerrillamail.com", "throwaway.email",
    "tempmail.com", "yopmail.com", "trashmail.com", "sharklasers.com",
    "guerrillamailblock.com", "10minutemail.com", "dispostable.com",
  ];
  const isDisposable = disposableDomains.includes(domain.toLowerCase());

  // 4. Role-based email check
  const roleBasedPrefixes = [
    "admin", "info", "support", "noreply", "no-reply", "contact",
    "help", "sales", "marketing", "team", "webmaster", "postmaster",
  ];
  const isRoleEmail = roleBasedPrefixes.includes(localPart.toLowerCase());

  // 5. SMTP is approximated (real SMTP checks require special infrastructure)
  const isSmtpValid = isMxValid;

  // Calculate score
  let score = 0;
  if (isSyntaxOk) score += 0.25;
  if (isMxValid) score += 0.35;
  if (!isDisposable) score += 0.25;
  if (!isRoleEmail) score += 0.15;

  const status =
    score >= 0.75 ? "valid" : score >= 0.5 ? "risky" : "invalid";

  return {
    email,
    status,
    score: Math.round(score * 100) / 100,
    isSyntaxOk,
    isMxValid,
    isSmtpValid,
    isDisposable,
    isRoleEmail,
    details: {
      domain,
      localPart,
      hasMxRecords: isMxValid,
    },
  };
}
