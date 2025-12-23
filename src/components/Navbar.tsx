"use client";

// Navbar component with responsive design and navigation links
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  //adding the navigation links 
  const navLinks = [
    { name: "Homepage", href: "/homepage" },
    { name: "Solutions", href: "/solutions" },
    { name: "Resources", href: "/resources" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl sm:text-2xl font-bold flex-shrink-0 group"
        >
          <span className="bg-gradient-to-r from-dark-red via-maroon to-dark-red bg-clip-text text-transparent">
            NEXUS
          </span>
          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2 group-hover:text-gray-700 transition-colors">
            by AKD
          </span>
        </Link>

        {/* Desktop Navigation Links - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-semibold transition-all duration-200 relative group ${
                pathname === link.href
                  ? "text-dark-red"
                  : "text-gray-700 hover:text-dark-red"
              }`}
            >
              {link.name}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-dark-red to-maroon transition-all duration-200 ${
                  pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          ))}
        </div>

        {/* Desktop Right Actions - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-dark-red transition-all duration-200 px-4 py-2 rounded-button hover:bg-gray-50"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-gradient-to-r from-dark-red to-maroon hover:from-maroon hover:to-dark-red text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-button transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Actions - Visible on tablet and below */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-medium text-gray-700 hover:text-dark-red transition-colors px-2 py-1"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-gradient-to-r from-dark-red to-maroon text-white text-xs font-bold px-3 py-1.5 rounded-button shadow-sm"
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
                    ? "text-dark-red"
                    : "text-gray-700 hover:text-dark-red"
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
