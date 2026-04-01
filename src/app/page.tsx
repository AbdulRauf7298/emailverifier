import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6">
              Email Verification Made Simple
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Validate email addresses in real-time. Check syntax, MX records,
              SMTP delivery, and detect disposable emails.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why EmailVerifier?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Simple Credit-Based Pricing
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Pay only for what you use. No subscriptions required.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-8 rounded-xl border ${
                    plan.featured
                      ? "border-blue-500 ring-2 ring-blue-500 bg-white shadow-xl"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {plan.featured && (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {plan.price}
                  </div>
                  <p className="text-gray-500 text-sm mb-6">{plan.credits}</p>
                  <ul className="space-y-2 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block text-center py-3 px-6 rounded-lg font-semibold transition ${
                      plan.featured
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 mt-8 text-sm">
              💬 For bulk purchases, contact us via WhatsApp for special rates.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const features = [
  {
    icon: "⚡",
    title: "Real-Time Verification",
    description:
      "Validate emails instantly via API or our dashboard. Get results in milliseconds.",
  },
  {
    icon: "🔍",
    title: "Deep Validation",
    description:
      "Check syntax, MX records, SMTP connectivity, disposable domains, and role-based emails.",
  },
  {
    icon: "📊",
    title: "Bulk Processing",
    description:
      "Upload CSV files with thousands of emails and verify them all at once.",
  },
  {
    icon: "🔑",
    title: "API Access",
    description:
      "Integrate email verification into your apps with our simple REST API.",
  },
  {
    icon: "💳",
    title: "Credit Based",
    description:
      "Pay only for what you use. Credits never expire. Start with 10 free credits.",
  },
  {
    icon: "📈",
    title: "Detailed History",
    description:
      "Track all your verifications with detailed logs and exportable reports.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    credits: "10 credits included",
    featured: false,
    features: [
      "10 email verifications",
      "API access",
      "Basic reporting",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "Contact Us",
    credits: "1,000 credits",
    featured: true,
    features: [
      "1,000 email verifications",
      "Bulk CSV upload",
      "API access",
      "Priority support",
      "Detailed analytics",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    credits: "Unlimited credits",
    featured: false,
    features: [
      "Unlimited verifications",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
    ],
  },
];
