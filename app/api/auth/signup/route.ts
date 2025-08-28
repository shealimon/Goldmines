import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/local-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    try {
      const user = await createUser(email, password);
      const token = generateToken(user.id);
      
      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        user: userWithoutPassword,
        token
      });

    } catch (error: any) {
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
