// Public surface of @cafe/shared-web.
export * from './types'
export { runtimeConfig } from './lib/runtimeConfig'
export { getApiBaseUrl, fetchWithRetry, getJson, ApiError, type ApiFailureKind } from './api/client'
export { reportApiFailure, type BackendOutcome } from './api/errorReporting'
export type { MenuTab } from './types/menu'
export { getMenu, getTodaysDishes } from './api/menu'
export { getWeeklyHours, getBarStatus, getUpcomingOverrides } from './api/hours'
export { getUpcomingEvents } from './api/events'
export { getBoard } from './api/board'
export { getVacancies } from './api/vacancy'
export { getAssociations } from './api/association'
export {
  FormError, submitComplaint, submitScreenForm, submitDeclarationForm, formsChallengeUrl,
  submitTip, submitInformation, submitLoan,
  type ComplaintInput, type ComplaintType,
  type TipInput, type InformationInput, type LoanInput, type UploadProgress,
} from './api/forms'
export { cn } from './lib/cn'
export { MAIN_CONTENT_ID, useFocusMainOnNavigate } from './lib/mainContent'
export { useApiResource, type ApiResource } from './lib/useApiResource'
export { useFormSubmit, type FormStatus, type FormProblem, type FieldProps } from './lib/useFormSubmit'
export { useDropdown } from './lib/useDropdown'
export { checkUpload, RECEIPT_UPLOAD, type UploadRule } from './lib/upload'
export { installChunkReload } from './lib/chunkReload'
export { initSentry, sentryRelease } from './lib/sentry'
export { applyPageMeta, type PageMeta } from './lib/seo'
export {
  groupWeeklyHours, groupKitchenHours, DAY_LABELS, DAY_ORDER, type HoursGroup,
} from './lib/hours'
export { LoadingSkeleton } from './components/LoadingSkeleton'
