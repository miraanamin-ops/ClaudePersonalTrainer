import Link from 'next/link'
import GymTripForm from '@/components/GymTripForm'

export default function NewTripPage() {
  return (
    <main className="min-h-screen pb-24 px-margin-mobile pt-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-lg">
        <Link
          href="/activity"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-surface-container-highest text-secondary hover:text-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-headline-lg-mobile text-on-surface">Log Trip</h1>
      </div>
      <GymTripForm />
    </main>
  )
}
