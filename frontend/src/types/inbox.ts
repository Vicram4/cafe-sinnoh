export type ApplicationStatus = 'NEW' | 'REVIEWED' | 'CONTACTED' | 'REJECTED'
export type JobPosition = 'BARISTA' | 'WAITER' | 'KITCHEN' | 'STORE_MANAGER' | 'MARKETING'

// Coincide con JobApplicationRead del backend.
export interface JobApplication {
  id: number
  full_name: string
  email: string
  phone: string
  position: JobPosition
  experience: string
  cover_letter: string | null
  status: ApplicationStatus
  created_at: string
}

// Coincide con ContactMessageRead del backend.
export interface ContactMessage {
  id: number
  name: string
  email: string
  message: string
  is_read: boolean
  created_at: string
}