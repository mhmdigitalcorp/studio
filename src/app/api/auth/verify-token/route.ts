
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token not provided' }, { status: 400 });
    }
    
    // Verify the token using Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Additional check for role from Firestore
    const userDocRef = db.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userDoc.data()?.role
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}
