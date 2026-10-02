import { endSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  endSession();
  return NextResponse.redirect(new URL('/login', request.url), { status: 302 });
}
