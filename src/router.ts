// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/academic-calendar`
  | `/contact`
  | `/dashboard`
  | `/dashboard/academic-calendar`
  | `/dashboard/attendance`
  | `/dashboard/attendance/:classId`
  | `/dashboard/contact`
  | `/dashboard/courses`
  | `/dashboard/exams`
  | `/dashboard/faculty-info`
  | `/dashboard/grades`
  | `/dashboard/hod-dean`
  | `/dashboard/laundry`
  | `/dashboard/marks`
  | `/dashboard/mess`
  | `/dashboard/payment-receipts`
  | `/dashboard/profile`
  | `/dashboard/settings`
  | `/dashboard/timetable`
  | `/debug`

export type Params = {
  '/dashboard/attendance/:classId': { classId: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
