import { NextResponse } from 'next/server';

import { db } from '@/lib/db';

export async function POST(req: Request) {
  const { username, password, registration_code } = await req.json();

  if (!username || !password || !registration_code) {
    return NextResponse.json(
      { error: 'Username, password and registration code are required' },
      { status: 400 }
    );
  }

  const existingUser = await db.checkUserExist(username);
  if (existingUser) {
    return NextResponse.json(
      { error: 'User already exists' },
      { status: 400 }
    );
  }

  const code = await db.getRegistrationCode(registration_code);
  if (!code || code.status !== 'unused') {
    return NextResponse.json(
      { error: 'Invalid registration code' },
      { status: 400 }
    );
  }

  await db.registerUser(username, password);
  code.status = 'used';
  code.used_at = new Date().toISOString();
  // TODO: get user id and save it to code.used_by_user_id
  await db.updateRegistrationCode(code);

  return NextResponse.json({ success: true });
}