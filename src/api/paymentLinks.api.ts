import api from './axios'

/** Link de pago con tarjeta (Culqi). El cobro lo hace la página del panel legacy. */
export interface PaymentLink {
  id: number
  first_name: string
  last_name: string
  document: string | null
  email: string
  phone: string
  currency: 'PEN' | 'USD'
  amount: number
  concept: string
  status: 'pendiente' | 'pagado' | 'rechazado'
  payment_code: string | null
  created_at: string
  url: string
}

export interface PaymentLinkInput {
  first_name: string
  last_name: string
  document: string
  email: string
  phone: string
  currency: 'PEN' | 'USD'
  amount: number | null
  concept: string
}

export async function listPaymentLinks(q = '') {
  const res = await api.get<{ data: PaymentLink[] }>('/superadmin/payment-links', { params: { q } })
  return res.data.data
}

export async function createPaymentLink(input: PaymentLinkInput) {
  const res = await api.post<{ data: PaymentLink }>('/superadmin/payment-links', input)
  return res.data.data
}
