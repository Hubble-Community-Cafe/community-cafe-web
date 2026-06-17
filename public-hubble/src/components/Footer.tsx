import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-hubble-100 bg-hubble-700 text-hubble-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="font-title text-xl font-bold">Hubble Community Cafe</span>
          <p className="mt-3 max-w-xs text-sm text-hubble-100/80">
            Enjoy our floating gold in the sunshine. Food, drinks, and events on the TU/e campus.
          </p>
        </div>

        <address className="space-y-2 text-sm not-italic text-hubble-100/90">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            De Lampendriessen 31-05, 5612 AH Eindhoven (TU/e Campus)
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <a href="mailto:info@hubble.cafe" className="hover:underline">
              info@hubble.cafe
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <a href="tel:+31402478507" className="hover:underline">
              +31 (0)40 247 8507
            </a>
          </p>
        </address>

        <nav aria-label="Footer" className="space-y-2 text-sm">
          <a
            href={EXTERNAL.reservations}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:underline"
          >
            Make a reservation
          </a>
          <Link to="/cafe/menu" className="block hover:underline">
            Menu
          </Link>
          <Link to="/events" className="block hover:underline">
            Events
          </Link>
          <Link to="/cafe/discount-policy" className="block hover:underline">
            Discount policy
          </Link>
        </nav>
      </div>

      <div className="border-t border-hubble-600">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-hubble-100/70 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Hubble Community Cafe. All rights reserved.</span>
          <span>The Uniform Conditions for the Hotel and Catering Industry (UVH) apply.</span>
        </div>
      </div>
    </footer>
  )
}
