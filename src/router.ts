// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/dashboard`
  | `/dashboard/academic-calendar`
  | `/dashboard/attendance`
  | `/dashboard/contact`
  | `/dashboard/courses`
  | `/dashboard/curriculum`
  | `/dashboard/faculty-info`
  | `/dashboard/grades`
  | `/dashboard/laundry`
  | `/dashboard/marks`
  | `/dashboard/mess`
  | `/dashboard/payment-receipts`
  | `/dashboard/profile`
  | `/dashboard/settings`
  | `/dashboard/timetable`
  | `/no-internet`

export type Params = {
  
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
