// /components/auth/AuthListener.tsx
'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useStore } from '@/hooks/useStore';
import { User } from '@/lib/types';

export default function AuthListener() {
  const setUser = useStore((state) => state.setUser);
  const setLoading = useStore((state) => state.setLoading);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        setUser(userData);
      } else {
        setUser(null);
      }
      // Set loading to false once we have the initial auth state
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setUser, setLoading]);

  return null; // This component does not render anything
}