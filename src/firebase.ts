import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent, Analytics } from 'firebase/analytics';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Set Firestore log level to 'error' to suppress non-critical warnings like minor clock synchronization drift
setLogLevel('error');

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let analytics: Analytics | null = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export const logAppEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.log('Sign-in popup closed or cancelled.');
    } else {
      console.error('Error signing in with Google:', error);
      let alertMsg = `Error signing in with Google: ${error.message || error.code}`;
      if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
        alertMsg = "Authentication failed. Please ensure that:\n\n1. Google Sign-In is ENABLED in your Firebase Console (Authentication -> Sign-in method).\n2. The current URL domain is added to your Authorized Domains in the Firebase Console (Authentication -> Settings -> Authorized domains).";
      }
      alert(alertMsg);
      throw error;
    }
  }
};
export const signInWithDemo = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error: any) {
    console.error('Error signing in anonymously:', error);
    let alertMsg = `Error signing in with Demo: ${error.message || error.code}`;
    if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
      alertMsg = "Anonymous authentication failed. Please ensure that the 'Anonymous' provider is ENABLED in your Firebase Console (Authentication -> Sign-in method).";
    }
    alert(alertMsg);
    throw error;
  }
};
export const signOut = () => auth.signOut();

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
