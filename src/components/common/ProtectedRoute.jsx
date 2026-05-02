import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export default function ProtectedRoute() {
  const { currentUser, loading } = useAuth()

  if (DEMO_MODE) return <Outlet />
  if (loading) return <LoadingSpinner fullscreen />
  if (!currentUser) return <Navigate to="/login" replace />

  return <Outlet />
}
