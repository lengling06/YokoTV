import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/lib/db';
import { RegistrationCode } from '@/lib/types';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await db.getAllRegistrationCodes();
  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { count } = await req.json();
  const codes = Array.from({ length: count }, () => uuidv4());
  await db.addRegistrationCodes(codes);
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const code: RegistrationCode = await req.json();
  await db.updateRegistrationCode(code);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await req.json();
  await db.deleteRegistrationCode(code);
  return NextResponse.json({ success: true });
}