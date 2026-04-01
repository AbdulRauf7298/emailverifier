import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { email: session!.user!.email! },
    select: { apiKey: true, credits: true, role: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* API Key Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">API Key</h2>
          <p className="text-gray-500 text-sm mb-4">
            Use this key to authenticate API requests. Keep it secret.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm font-mono text-gray-700 truncate">
              {user?.apiKey ?? "Not generated"}
            </code>
            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Copy
            </button>
          </div>
        </div>

        {/* Credits Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Credits</h2>
          <p className="text-gray-500 text-sm mb-4">
            Each email verification costs 1 credit.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-blue-600">
              {user?.credits ?? 0}
            </div>
            <div className="text-gray-500 text-sm">credits remaining</div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            💬 To purchase more credits, contact us via{" "}
            <a
              href="https://wa.me/+923001234567"
              className="underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>{" "}
            for payment via bank transfer.
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{session?.user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Account type</dt>
              <dd className="text-gray-900 capitalize">
                {user?.role?.toLowerCase()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
