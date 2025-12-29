import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Validate password length (6-64 chars)
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 64) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    const hash = process.env.SUBSCRIPTION_HASH;
    
    if (!hash) {
      console.error('SUBSCRIPTION_HASH not configured');
      return NextResponse.json({ success: false }, { status: 500 });
    }
    
    // Compare password against stored hash
    const isValid = await bcrypt.compare(password, hash);
    
    return NextResponse.json({ success: isValid });
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
