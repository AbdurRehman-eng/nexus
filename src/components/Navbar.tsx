'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Homepage', href: '/homepage' },
    { name: 'Solutions', href: '/solutions' },
    { name: 'Resources', href: '/resources' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <nav className="bg-white border-b border-gray-border px-4 sm:px-6 md:px-8 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-bold text-dark-red flex-shrink-0">
          NEXUS <span className="text-xs sm:text-sm font-normal text-gray-600">by AKD</span>
        </Link>

        {/* Desktop Navigation Links - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-dark-red'
                  : 'text-gray-700 hover:text-dark-red'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-gray-700 hover:text-dark-red transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Actions - Visible on tablet and below */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-medium text-gray-700 hover:text-dark-red transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="btn-primary text-xs px-3 py-1.5"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button - Only visible on large screens and below when nav is hidden */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden ml-2 p-2 text-gray-700 hover:text-dark-red focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-border">
          <div className="flex flex-col space-y-3 pb-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium transition-colors px-2 py-1 ${
                  pathname === link.href
                    ? 'text-dark-red'
                    : 'text-gray-700 hover:text-dark-red'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

