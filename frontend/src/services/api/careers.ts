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

// multipart/form-data (no JSON) para poder adjuntar el CV en la misma petición.
export function submitJobApplication(payload: JobApplicationPayload, cv?: File) {
  const form = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value) form.append(key, value)
  }
  if (cv) form.append('cv', cv)
  return api.post('/careers/applications', form)
}

export function fetchApplications(token: string): Promise<JobApplication[]> {
  return api.get<JobApplication[]>('/careers/applications', { token })
}

export function downloadApplicationCv(id: number, token: string): Promise<Blob> {
  return api.getBlob(`/careers/applications/${id}/cv`, { token })
}

export function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
  token: string,
): Promise<JobApplication> {
  return api.patch<JobApplication>(`/careers/applications/${id}/status`, { status }, { token })
}