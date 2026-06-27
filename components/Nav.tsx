import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex">
      <Link href="/" className="flex-1 py-4 text-center text-xs font-medium text-gray-400 hover:text-white transition-colors">
        Home
      </Link>
      <Link href="/body" className="flex-1 py-4 text-center text-xs font-medium text-gray-400 hover:text-white transition-colors">
        Body
      </Link>
    </nav>
  )
}
