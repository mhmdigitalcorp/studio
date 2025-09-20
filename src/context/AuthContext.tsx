// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface User extends DocumentData {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (credentials: { email: any; password: any; name: any; }) => Promise<any>;
  signIn: (email: any, pass: any) => Promise<any>;
  logOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ uid: user.uid, ...userDoc.data() } as User);
        } else {
            // This case might happen if a user exists in auth but not firestore
            // We can choose to create a doc here, or log them out.
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signUp = async ({ email, password, name }: {email:any, password:any, name:any}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      role: 'user', // default role
      createdAt: new Date(),
    });

    return userCredential;
  };
  
  const signIn = (email:any, password:any) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

  const logOut = () => {
    return signOut(auth).then(() => {
      router.push('/');
    });
  }

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    logOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};