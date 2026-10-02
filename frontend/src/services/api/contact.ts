import { api } from './client'
import type { ContactMessage } from '../../types/inbox'

export interface ContactMessagePayload {
  name: string
  email: string
  message: string
}

export function submitContactMessage(payload: ContactMessagePayload) {
  return api.post('/contact', payload)
}

export function fetchContactMessages(token: string): Promise<ContactMessage[]> {
  return api.get<ContactMessage[]>('/contact', { token })
}

export function setMessageRead(id: number, isRead: boolean, token: string): Promise<ContactMessage> {
  return api.patch<ContactMessage>(`/contact/${id}`, { is_read: isRead }, { token })
}