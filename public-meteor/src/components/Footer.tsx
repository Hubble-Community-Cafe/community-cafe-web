import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-meteor-100 bg-meteor-500 text-meteor-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <span className="font-title text-xl font-bold">Meteor</span>
          <p className="mt-3 max-w-xs text-sm text-meteor-50/80">
            A lively cafe and meeting space by day, a relaxed spot for events and gatherings by
            night.
          </p>
        </div>

        <address className="space-y-2 text-sm not-italic text-meteor-50/90">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            Blauwe loper 60, 5612 TA Eindhoven
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <a href="mailto:info@meteor.cafe" className="hover:underline">
              info@meteor.cafe
            </a>
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0" />
            <a href="tel:+31402478507" className="hover:underline">
              +31 (0)40 247 8507
            </a>
          </p>
          <p className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            Mon to Fri 16:00 to 02:00; weekend closed
          </p>
        </address>

        <nav aria-label="Footer" className="space-y-2 text-sm">
          <Link to="/menu" className="block hover:underline">
            Menu
          </Link>
          <Link to="/menu/discount-policy" className="block hover:underline">
            Discount policy
          </Link>
          <a
            href={EXTERNAL.reservations}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:underline"
          >
            Make a reservation
          </a>
        </nav>
      </div>

      <div className="border-t border-meteor-600">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-meteor-50/70 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Meteor Community Cafe. All rights reserved.</span>
          <span>The Uniform Conditions for the Hotel and Catering Industry (UVH) apply.</span>
        </div>
      </div>
    </footer>
  )
}
