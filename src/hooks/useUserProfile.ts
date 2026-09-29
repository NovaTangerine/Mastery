import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({});
  const [exists, setExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        setExists(snapshot.exists());
        const data = snapshot.data() || {};
        setProfile({ bio: data.bio || '', socialLinks: data.socialLinks || [] });
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load profile', error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const saveProfile = async (updates: UserProfile) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    try {
      if (exists) {
        await updateDoc(ref, { ...updates, updatedAt: Date.now() });
      } else {
        // First write creates the user doc; the rules require role 'user' on create.
        await setDoc(ref, {
          role: 'user',
          displayName: user.displayName || null,
          email: user.email || null,
          photoURL: user.photoURL || null,
          ...updates,
          updatedAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  return { profile, isLoading, saveProfile };
}
