import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) return <LoadingSpinner fullscreen />
  if (!currentUser) return <Navigate to="/login" replace />

  return <Outlet />
}
