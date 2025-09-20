// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  deleteUser 
} from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { manageUser } from '@/ai/flows/manage-user';
import { User as AppUser } from '@/lib/data';

interface User extends DocumentData {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin';
  status?: string;
  lastLogin?: string;
  score?: number;
  progress?: number;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (credentials: { email: string; password: string; name: string; }) => Promise<any>;
  signIn: (email: string, pass: string) => Promise<any>;
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
              status: 'Active',
              lastLogin: new Date().toISOString().split('T')[0],
              score: 0,
              progress: 0,
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
  
  const signUp = async ({ email, password, name }: {email: string, password: string, name: string}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: Partial<AppUser> = {
        id: userCredential.user.uid,
        name,
        email,
        status: 'Active',
        role: 'user',
        lastLogin: new Date().toISOString().split('T')[0],
        score: 0,
        progress: 0,
      };

      const result = await manageUser({ 
        action: 'create', 
        userData: newUser, 
        userId: userCredential.user.uid 
      });

      if (!result.success) {
        await deleteUser(userCredential.user);
        console.error("Failed to create user document in Firestore:", result.message);
        throw new Error(result.message);
      }
      
      return userCredential;
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in or use a different email.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    }
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
