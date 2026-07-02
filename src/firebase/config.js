import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate that env vars loaded — missing values cause silent Firestore failures
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)
if (missingKeys.length > 0) {
  console.error('[Firebase] Missing env vars:', missingKeys, '— Firestore will fail.')
}

// Guard against HMR double-initialization (Vite re-evaluates modules on hot reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Firestore: use existing instance if already initialized (HMR-safe),
// otherwise create with IndexedDB offline persistence (multi-tab safe).
let db
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager:     persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    }),
  }, 'axiom-web')
} catch {
  // initializeFirestore throws if already called — fall back to getFirestore
  db = getFirestore(app, 'axiom-web')
}
export { db }

export const storage = getStorage(app)

// Fail fast instead of the SDK default 2-minute retry loop. If the bucket is
// unreachable (Storage not enabled, offline), uploads reject in seconds and
// callers can fall back instead of appearing frozen.
storage.maxOperationRetryTime = 15_000
storage.maxUploadRetryTime    = 15_000

export default app
