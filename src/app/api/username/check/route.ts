/**
 * Username Availability Check API
 * Task 17: Real-time username availability check during registration
 * 
 * GET /api/username/check?username=johndoe
 * 
 * Returns:
 * { available: boolean, message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Reserved usernames that regular users cannot register with
const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'root',
  'superadmin',
  'moderator',
  'mod',
  'support',
  'help',
  'info',
  'contact',
  'api',
  'auth',
  'login',
  'register',
  'dashboard',
  'profile',
  'settings',
  'account',
  'user',
  'users',
  'system',
  'null',
  'undefined',
  'test',
  'demo',
  'example',
  'inaya',
  'inaya-auth',
];

// Username validation regex
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Check if username is provided
    if (!username) {
      return NextResponse.json(
        { available: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'Username must be 3-30 characters, letters, numbers, underscores, hyphens only' 
        },
        { status: 400 }
      );
    }

    // Check if username starts or ends with hyphen
    if (username.startsWith('-') || username.endsWith('-')) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'Username cannot start or end with a hyphen' 
        },
        { status: 400 }
      );
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'This username is reserved and cannot be used' 
        },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'This username is already taken' 
        },
        { status: 200 }
      );
    }

    // Username is available
    return NextResponse.json(
      { 
        available: true, 
        message: 'Username is available' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { 
        available: false, 
        message: 'Error checking username availability' 
      },
      { status: 500 }
    );
  }
}
