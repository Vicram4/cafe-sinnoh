import { api } from './client'
import type { ApplicationStatus, JobApplication } from '../../types/inbox'

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

export function fetchApplications(token: string): Promise<JobApplication[]> {
  return api.get<JobApplication[]>('/careers/applications', { token })
}

export function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
  token: string,
): Promise<JobApplication> {
  return api.patch<JobApplication>(`/careers/applications/${id}/status`, { status }, { token })
}