import type { User } from '@supabase/supabase-js'
import type { ScenarioLibrary } from '../types'
import { getSupabaseClient, getSupabaseConfigError } from './supabaseClient'

export interface CloudResult {
  success: boolean
  error?: string
}

export interface CloudSessionResult extends CloudResult {
  user?: User | null
}

export interface CloudRestoreResult extends CloudResult {
  data?: ScenarioLibrary
  updatedAt?: string
}

export async function getCloudSession(): Promise<CloudSessionResult> {
  const configError = getSupabaseConfigError()
  if (configError) return { success: false, error: configError }

  const client = getSupabaseClient()
  if (!client) return { success: false, error: 'Supabase is not configured' }

  const { data, error } = await client.auth.getUser()
  if (error) return { success: false, error: error.message }
  return { success: true, user: data.user }
}

export async function sendMagicLink(email: string): Promise<CloudResult> {
  const configError = getSupabaseConfigError()
  if (configError) return { success: false, error: configError }

  const client = getSupabaseClient()
  if (!client) return { success: false, error: 'Supabase is not configured' }

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signOutCloud(): Promise<CloudResult> {
  const client = getSupabaseClient()
  if (!client) return { success: false, error: 'Supabase is not configured' }

  const { error } = await client.auth.signOut()
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function backupScenarioLibrary(library: ScenarioLibrary): Promise<CloudResult & { updatedAt?: string }> {
  const session = await getCloudSession()
  if (!session.success) return session
  if (!session.user) return { success: false, error: 'Sign in before backing up scenarios' }

  const client = getSupabaseClient()
  if (!client) return { success: false, error: 'Supabase is not configured' }

  const updatedAt = new Date().toISOString()
  const { error } = await client
    .from('scenario_libraries')
    .upsert({
      user_id: session.user.id,
      data: library,
      updated_at: updatedAt,
    })

  if (error) return { success: false, error: error.message }
  return { success: true, updatedAt }
}

export async function restoreScenarioLibrary(): Promise<CloudRestoreResult> {
  const session = await getCloudSession()
  if (!session.success) return session
  if (!session.user) return { success: false, error: 'Sign in before restoring scenarios' }

  const client = getSupabaseClient()
  if (!client) return { success: false, error: 'Supabase is not configured' }

  const { data, error } = await client
    .from('scenario_libraries')
    .select('data, updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data?.data) return { success: false, error: 'No cloud backup found' }

  return {
    success: true,
    data: data.data as ScenarioLibrary,
    updatedAt: data.updated_at,
  }
}
