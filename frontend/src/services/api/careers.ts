import { api } from './client'

export interface JobApplicationPayload {
  full_name: string
  email: string
  phone: string
  position: string
  experience: string
  cover_letter?: string | null
}

export function submitJobApplication(payload: JobApplicationPayload) {
  return api.post('/careers/applications', payload)
}