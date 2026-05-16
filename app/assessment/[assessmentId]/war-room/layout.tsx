import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function WarRoomLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
