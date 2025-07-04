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

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
      
      // Clear any local storage or session data
      localStorage.clear()
      sessionStorage.clear()
      
      // Perform the actual sign out
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('Sign out error:', error)
      }
      
      // Force a page reload to ensure clean state
      window.location.href = '/'
    } catch (error) {
      console.warn('Sign out error:', error)
      // Force user to null and reload even if there's an error
      setUser(null)
      window.location.href = '/'
    }
  }

  return { user, loading, signOut }
}