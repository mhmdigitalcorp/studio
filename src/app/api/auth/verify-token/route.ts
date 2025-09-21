import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';
import { doc, getDoc } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await getAuth(app).verifyIdToken(token);
    
    // Additional check for role from Firestore
    const userDocRef = doc(db, 'users', decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Success', uid: decodedToken.uid, role: userDoc.data()?.role }, { status: 200 });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
