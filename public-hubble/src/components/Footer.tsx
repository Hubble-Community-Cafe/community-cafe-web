import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Footer() {
  return (
    <footer className="bg-hubble-700 text-hubble-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <img
            src="/hubble-logo-white.png"
            alt="Hubble Community Cafe"
            className="h-12 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm text-hubble-100/80">
            Enjoy our floating gold in the sunshine. Food, drinks, and events on the TU/e campus.
          </p>
        </div>

        <div>
          <h2 className="font-title text-sm font-bold uppercase tracking-wide text-hubble-200">
            Contact
          </h2>
          <address className="mt-3 space-y-2 text-sm not-italic text-hubble-100/90">
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
        </div>

        <div>
          <h2 className="font-title text-sm font-bold uppercase tracking-wide text-hubble-200">
            Opening Times
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm text-hubble-100/90">
            <div className="flex justify-between gap-4">
              <dt>Weekdays</dt>
              <dd>11:00 to 02:00</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Saturday</dt>
              <dd>15:00 to 20:00</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Sunday</dt>
              <dd>On reservation</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Kitchen</dt>
              <dd>12:00 to 19:30</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a
              href={EXTERNAL.reservations}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:underline"
            >
              Make a reservation
            </a>
            <Link to="/cafe/menu" className="hover:underline">
              Menu
            </Link>
            <Link to="/events" className="hover:underline">
              Events
            </Link>
          </div>
        </div>
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
