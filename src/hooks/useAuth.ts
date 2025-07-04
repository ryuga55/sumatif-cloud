import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('Session error:', error.message)
          // Clear any invalid tokens
          await supabase.auth.signOut()
        }
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.warn('Failed to get session:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        // Handle signed out state explicitly
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setUser(session?.user ?? null)
        } else if (event === 'USER_UPDATED') {
          setUser(session?.user ?? null)
        } else {
          setUser(session?.user ?? null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      // Immediately set user to null for instant UI update
      setUser(null)
      
      // Then perform the actual sign out
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('Sign out error:', error)
        // Even if there's an error, keep user as null since we want to log out
      }
    } catch (error) {
      console.warn('Sign out error:', error)
      // Force clear user state even if signOut fails
      setUser(null)
    }
  }

  return { user, loading, signOut }
}