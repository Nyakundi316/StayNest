import Link from "next/link";
import { Home as HomeIcon, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white mt-24">
      <div className="container-px py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-xl mb-3">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-brand-500 text-white">
              <HomeIcon size={18} />
            </span>
            <span className="font-semibold">StayNest</span>
          </div>
          <p className="text-sm text-ink-500 leading-relaxed">
            Cosy, trusted stays across Kenya. We help travellers and short-stay
            visitors find homes that feel like home.
          </p>
        </div>

        <div>
          <div className="font-semibold mb-3">Explore</div>
          <ul className="space-y-2 text-sm text-ink-600">
            <li><Link href="/listings" className="hover:text-brand-600">All stays</Link></li>
            <li><Link href="/listings?type=Villa" className="hover:text-brand-600">Villas</Link></li>
            <li><Link href="/listings?type=Apartment" className="hover:text-brand-600">Apartments</Link></li>
            <li><Link href="/listings?type=Studio" className="hover:text-brand-600">Studios</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm text-ink-600">
            <li><Link href="/about" className="hover:text-brand-600">About</Link></li>
            <li><Link href="/contact" className="hover:text-brand-600">Contact</Link></li>
            <li><Link href="/admin" className="hover:text-brand-600">Agent dashboard</Link></li>
            <li><Link href="/admin/add-property" className="hover:text-brand-600">Add property</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-3">Get in touch</div>
          <ul className="space-y-2 text-sm text-ink-600">
            <li className="flex items-center gap-2"><Phone size={14} /> +254 700 000 000</li>
            <li className="flex items-center gap-2"><Mail size={14} /> hello@staynest.co.ke</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Nairobi, Kenya</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100">
        <div className="container-px py-6 text-xs text-ink-500 flex flex-col sm:flex-row justify-between gap-2">
          <div>© {new Date().getFullYear()} StayNest. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-brand-600">Privacy</Link>
            <Link href="/about" className="hover:text-brand-600">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
