import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Footer() {
  return (
    <footer className="bg-meteor-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <img src="/meteor-logo-white.png" alt="Meteor Community Cafe" className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-white/70">
            A lively cafe and meeting space by day, a relaxed spot for events and gatherings by
            night.
          </p>
        </div>

        <div>
          <h2 className="font-title text-sm font-bold uppercase tracking-wide text-meteor-accent">
            Visit us
          </h2>
          <address className="mt-3 space-y-2 text-sm not-italic text-white/80">
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
          </address>
        </div>

        <div>
          <h2 className="font-title text-sm font-bold uppercase tracking-wide text-meteor-accent">
            Opening hours
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Monday to Friday: 16:00 to 02:00</span>
            </div>
            <div className="pl-6">Saturday and Sunday: closed</div>
          </dl>
          <h2 className="mt-6 font-title text-sm font-bold uppercase tracking-wide text-meteor-accent">
            Quick links
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link to="/menu" className="hover:underline">
              Menu
            </Link>
            <Link to="/menu/discount-policy" className="hover:underline">
              Discount policy
            </Link>
            <a
              href={EXTERNAL.reservations}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-meteor-accent hover:underline"
            >
              Make a reservation
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Meteor Community Cafe. All rights reserved.</span>
          <span>The Uniform Conditions for the Hotel and Catering Industry (UVH) apply.</span>
        </div>
      </div>
      {/* Gold accent strip, echoing the live site. */}
      <div className="h-2 w-full bg-meteor-accent" />
    </footer>
  )
}
