// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { manageUser } from '@/ai/flows/manage-user';
import { User as AppUser } from '@/lib/data';

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
             const tempUser: User = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || 'New User',
              role: 'user',
            };
            setCurrentUser(tempUser);
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
    
    // After creating auth user, call the secure backend flow to create the Firestore document.
    const newUser: Partial<AppUser> = {
      id: userCredential.user.uid, // Important: Use the auth UID as the document ID
      name,
      email,
      status: 'Active',
      role: 'user'
    };

    // This calls the secure backend flow.
    const result = await manageUser({ action: 'create', userData: newUser, userId: userCredential.user.uid });

    if (!result.success) {
      // If Firestore doc creation fails, we should consider how to handle it.
      // For now, we'll log the error. In a real app, you might delete the auth user
      // or add them to a retry queue.
      console.error("Failed to create user document in Firestore:", result.message);
      throw new Error(result.message);
    }
    
    // The user object in the context will be set by the onAuthStateChanged listener.
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
