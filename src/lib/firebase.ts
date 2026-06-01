import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  serverTimestamp,
  FieldValue,
  getDocFromServer
} from "firebase/firestore";

import { ForecastParams, IncomeStream, ExpenseCategory, LifeEvent, Scenario } from "../types";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (Must explicitly pass the custom firestoreDatabaseId)
export const db = getFirestore(app);

// Mandated initial validation of Firebase Firestore connectivity
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
if (typeof window !== "undefined") {
  testConnection();
}

const provider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Security-mandated Firestore error interceptor
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Intercept: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Pop-up Authentication wrapper
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Popup Sign in Error:", error);
    throw error;
  }
}

// Sign out wrapper
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign Out Error:", error);
    throw error;
  }
}

// Interface representing the user configuration inside Firestore
export interface DbUserConfig {
  uid: string;
  email: string;
  createdAt: FieldValue | any;
  updatedAt: FieldValue | any;
  params: ForecastParams;
  incomeStreams: IncomeStream[];
  expenseCategories: ExpenseCategory[];
  events: LifeEvent[];
}

/**
 * Saves or updates UserConfig inside Firebase Firestore.
 */
export async function saveUserConfig(
  userId: string, 
  email: string, 
  params: ForecastParams, 
  incomeStreams: IncomeStream[], 
  expenseCategories: ExpenseCategory[], 
  events: LifeEvent[]
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    const existingSnap = await getDoc(docRef);
    
    // Clean array elements to match standard interfaces and remove extraneous properties
    const cleanIncome = incomeStreams.map(({ id, name, amount }) => ({ id, name, amount }));
    const cleanExpenses = expenseCategories.map(({ id, name, amount }) => ({ id, name, amount }));
    const cleanEvents = events.map(({ id, name, type, amount, yearOffset, active }) => ({
      id, name, type, amount, yearOffset, active: !!active
    }));

    if (!existingSnap.exists()) {
      // Document creation (insert)
      const newConfig: DbUserConfig = {
        uid: userId,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        params,
        incomeStreams: cleanIncome,
        expenseCategories: cleanExpenses,
        events: cleanEvents
      };
      await setDoc(docRef, newConfig);
    } else {
      // Document modification (update)
      const existingData = existingSnap.data();
      const docUpdate = {
        uid: userId,
        email,
        createdAt: existingData.createdAt, // createdAt remains immutable per rules
        updatedAt: serverTimestamp(),
        params,
        incomeStreams: cleanIncome,
        expenseCategories: cleanExpenses,
        events: cleanEvents
      };
      await setDoc(docRef, docUpdate);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieves UserConfig from Firestore.
 */
export async function getUserConfig(userId: string): Promise<DbUserConfig | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, "users", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DbUserConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Saves a custom sub-scenario inside '/users/{userId}/scenarios/{scenarioId}'.
 */
export async function saveScenarioDb(
  userId: string, 
  scen: Scenario
): Promise<void> {
  const path = `users/${userId}/scenarios/${scen.id}`;
  try {
    const docRef = doc(db, "users", userId, "scenarios", scen.id);
    const existingSnap = await getDoc(docRef);

    const cleanIncome = scen.incomeStreams.map(({ id, name, amount }) => ({ id, name, amount }));
    const cleanExpenses = scen.expenseCategories.map(({ id, name, amount }) => ({ id, name, amount }));
    const cleanEvents = scen.events.map(({ id, name, type, amount, yearOffset, active }) => ({
      id, name, type, amount, yearOffset, active: !!active
    }));

    const rawScenario = {
      id: scen.id,
      name: scen.name,
      description: scen.description,
      incomeStreams: cleanIncome,
      expenseCategories: cleanExpenses,
      events: cleanEvents,
      ownerId: userId,
      createdAt: existingSnap.exists() ? existingSnap.data()?.createdAt : serverTimestamp()
    };

    await setDoc(docRef, rawScenario);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Sync / retrieve all custom scenarios of a user from Firestore.
 */
export async function getScenariosDb(userId: string): Promise<Scenario[]> {
  const path = `users/${userId}/scenarios`;
  try {
    const listSnapshot = await getDocs(collection(db, "users", userId, "scenarios"));
    const list: Scenario[] = [];
    listSnapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: data.id,
        name: data.name,
        description: data.description,
        incomeStreams: data.incomeStreams || [],
        expenseCategories: data.expenseCategories || [],
        events: data.events || []
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Deletes a scenario document.
 */
export async function deleteScenarioDb(userId: string, scenarioId: string): Promise<void> {
  const path = `users/${userId}/scenarios/${scenarioId}`;
  try {
    const docRef = doc(db, "users", userId, "scenarios", scenarioId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
