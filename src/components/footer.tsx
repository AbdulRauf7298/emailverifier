import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">
              ✉️ EmailVerifier
            </h3>
            <p className="text-sm">
              Professional email validation service. Verify emails in real-time
              with our powerful API.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  API Access
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://wa.me/+923001234567"
                  className="hover:text-white transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:unboundtutors@gmail.com"
                  className="hover:text-white transition"
                >
                  Email Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-sm text-center">
          © {new Date().getFullYear()} EmailVerifier. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
