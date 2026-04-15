import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const googleProvider = new GoogleAuthProvider()

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [currentUser,        setCurrentUser]        = useState(null)
  const [userProfile,        setUserProfile]        = useState(null)
  const [loading,            setLoading]            = useState(true)
  const [firestoreAvailable, setFirestoreAvailable] = useState(true)

  // ── Fetch or create Firestore user document (max 3 attempts) ─────────────
  async function fetchUserProfile(uid, attempt = 1) {
    const MAX_ATTEMPTS = 3
    try {
      const ref  = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setUserProfile(snap.data())
        setFirestoreAvailable(true)
        return snap.data()
      }
      return null
    } catch (err) {
      console.error(`[AuthContext] fetchUserProfile attempt ${attempt}/${MAX_ATTEMPTS} failed:`)
      console.error('[AuthContext] Error code:', err.code)
      console.error('[AuthContext] Error message:', err.message)
      console.error('[AuthContext] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))

      if (attempt < MAX_ATTEMPTS) {
        const delay = attempt * 2000 // 2s, 4s
        console.warn(`[AuthContext] Retrying in ${delay}ms…`)
        await new Promise(res => setTimeout(res, delay))
        return fetchUserProfile(uid, attempt + 1)
      }

      // All attempts exhausted — mark Firestore as unreachable
      console.error('[AuthContext] Firestore unreachable after', MAX_ATTEMPTS, 'attempts. Profile features disabled.')
      setFirestoreAvailable(false)
      return null
    }
  }

  // ── Sign up ───────────────────────────────────────────────────────────────
  async function signup(email, password, displayName) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    // Set display name on Firebase Auth profile
    await firebaseUpdateProfile(user, { displayName })

    // Create Firestore user document
    const profile = {
      uid:         user.uid,
      email:       user.email,
      displayName,
      createdAt:   serverTimestamp(),
      preferences: {},
    }

    try {
      await setDoc(doc(db, 'users', user.uid), profile)
      setUserProfile(profile)
    } catch (err) {
      console.warn('[AuthContext] Could not write user profile to Firestore:', err.message)
      // Auth still succeeded — let the user in
      setUserProfile(profile)
    }
    return user
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login(email, password) {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged will fetch the profile — no need to duplicate it here
    return user
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function logout() {
    await signOut(auth)
    setUserProfile(null)
  }

  // ── Password reset ────────────────────────────────────────────────────────
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function loginWithGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider)

    // Check if profile already exists; create it if not
    const ref  = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const profile = {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName || 'Writer',
        createdAt:   serverTimestamp(),
        preferences: {},
      }
      try {
        await setDoc(ref, profile)
        setUserProfile(profile)
      } catch (err) {
        console.warn('[AuthContext] Could not write Google user profile:', err.message)
        setUserProfile(profile)
      }
    } else {
      setUserProfile(snap.data())
    }
    return user
  }

  // ── Update profile ────────────────────────────────────────────────────────
  async function updateUserProfile(updates) {
    if (!currentUser) return

    // Update Firebase Auth display name if provided
    if (updates.displayName) {
      await firebaseUpdateProfile(currentUser, { displayName: updates.displayName })
    }

    // Update Firestore document
    const ref = doc(db, 'users', currentUser.uid)
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() })

    setUserProfile(prev => ({ ...prev, ...updates }))
  }

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)  // unblock the UI immediately — don't wait on Firestore
      if (user) {
        // Fetch profile in the background; app is already usable without it
        fetchUserProfile(user.uid).catch(err =>
          console.warn('[AuthContext] Could not fetch user profile:', err.message)
        )
      } else {
        setUserProfile(null)
      }
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    loading,
    firestoreAvailable,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
