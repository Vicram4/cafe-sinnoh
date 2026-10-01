import { api } from './client'

export interface ContactMessagePayload {
  name: string
  email: string
  message: string
}

export function submitContactMessage(payload: ContactMessagePayload) {
  return api.post('/contact', payload)
}