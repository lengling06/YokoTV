import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { RegistrationCode } from '@/lib/types';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await db.getAllRegistrationCodes();
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { count } = await req.json();
  const codes = Array.from({ length: count }, () => uuidv4());
  await db.addRegistrationCodes(codes);
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const code: RegistrationCode = await req.json();
  await db.updateRegistrationCode(code);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await req.json();
  await db.deleteRegistrationCode(code);
  return NextResponse.json({ success: true });
}