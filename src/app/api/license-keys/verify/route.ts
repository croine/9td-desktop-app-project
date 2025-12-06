import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { licenseKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    // Validate key presence
    if (!key) {
      return NextResponse.json(
        { 
          error: 'License key is required',
          code: 'MISSING_KEY' 
        },
        { status: 400 }
      );
    }

    // Validate key format (XXXX-XXXX-XXXX-XXXX)
    const keyFormatRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!keyFormatRegex.test(key)) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Invalid key format. Expected format: XXXX-XXXX-XXXX-XXXX'
        },
        { status: 200 }
      );
    }

    // Query database for the key
    const licenseKeyRecord = await db
      .select()
      .from(licenseKeys)
      .where(eq(licenseKeys.key, key))
      .limit(1);

    // Check if key exists
    if (licenseKeyRecord.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'License key not found'
        },
        { status: 200 }
      );
    }

    const license = licenseKeyRecord[0];

    // Check if status is "pending"
    if (license.status !== 'pending') {
      return NextResponse.json(
        {
          valid: false,
          reason: `License key status is ${license.status}. Only pending keys can be activated.`
        },
        { status: 200 }
      );
    }

    // Check if key has expired
    const now = new Date();
    const expiresAt = new Date(license.expiresAt);
    
    if (expiresAt < now) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'License key has expired'
        },
        { status: 200 }
      );
    }

    // Key is valid - return success response
    return NextResponse.json(
      {
        valid: true,
        email: license.email,
        expiresAt: license.expiresAt
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/license/verify error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}