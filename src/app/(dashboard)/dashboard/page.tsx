import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { EmailVerifyForm } from "@/components/email-verify-form";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { email: session!.user!.email! },
    include: {
      verifications: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const totalVerifications = await prisma.emailVerification.count({
    where: { userId: user!.id },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0] ?? "User"}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your email verification activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Available Credits"
          value={user?.credits ?? 0}
          icon="💳"
          color="blue"
        />
        <StatCard
          title="Total Verifications"
          value={totalVerifications}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Account Type"
          value={user?.role ?? "USER"}
          icon="👤"
          color="purple"
        />
      </div>

      {/* Quick Verify */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Email Verify
        </h2>
        <EmailVerifyForm credits={user!.credits} />
      </div>

      {/* Recent Verifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Verifications
          </h2>
          <Link
            href="/history"
            className="text-blue-600 text-sm hover:underline"
          >
            View all →
          </Link>
        </div>
        {user?.verifications.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No verifications yet. Try verifying an email above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {user?.verifications.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 text-gray-800">{v.email}</td>
                    <td className="py-2">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-2 text-gray-700">
                      {(v.score * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 text-gray-400">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: "blue" | "green" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
  };
  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    valid: "bg-green-100 text-green-700",
    invalid: "bg-red-100 text-red-700",
    risky: "bg-yellow-100 text-yellow-700",
    unknown: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        colors[status] ?? colors.unknown
      }`}
    >
      {status}
    </span>
  );
}
