import React from 'react';
import Link from 'next/link';
import { Instagram, Linkedin, Twitter } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-accent/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-teal-600">
                <span className="text-white font-semibold text-sm">W</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Wolistic</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted ecosystem for holistic wellness — body, mind, and diet.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-4 text-base font-medium">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profiles"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Professionals
                </Link>
              </li>
              <li>
                <Link
                  href="/results?scope=products"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Products & Services
                </Link>
              </li>
              <li>
                <Link
                  href="/profiles"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Influencers
                </Link>
              </li>
            </ul>
          </div>

          {/* Partner */}
          <div>
            <h3 className="mb-4 text-base font-medium">Partner</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/corporate-wellness"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Corporate Wellness
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  For Partners
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 text-base font-medium">Connect</h3>
            <div className="flex gap-3">
              <button
                className="w-9 h-9 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors"
                aria-label="Instagram"
                title="Instagram"
                type="button"
              >
                <Instagram size={18} className="text-muted-foreground" />
              </button>
              <button
                className="w-9 h-9 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors"
                aria-label="Twitter"
                title="Twitter"
                type="button"
              >
                <Twitter size={18} className="text-muted-foreground" />
              </button>
              <button
                className="w-9 h-9 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
                title="LinkedIn"
                type="button"
              >
                <Linkedin size={18} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Wolistic. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}