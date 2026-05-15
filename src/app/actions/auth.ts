"use server"

// Auth is handled by the Express backend via /api/auth/* routes.
// LoginForm and RegisterForm call those routes directly with client-side fetch.
// This file is kept as a stub so any legacy imports don't break during migration.

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string>
}
