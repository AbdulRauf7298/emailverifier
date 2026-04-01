"use client";

import { useState } from "react";

interface VerifyResult {
  email: string;
  status: string;
  score: number;
  isSyntaxOk: boolean;
  isMxValid: boolean;
  isSmtpValid: boolean;
  isDisposable: boolean;
  isRoleEmail: boolean;
}

export function EmailVerifyForm({
  credits,
}: {
  credits: number;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    const res = await fetch(`/api/email?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Verification failed");
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="enter@email.com"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        <button
          type="submit"
          disabled={credits <= 0 || loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Checking..." : "Verify"}
        </button>
      </form>

      {credits <= 0 && (
        <p className="text-red-500 text-sm mt-2">
          No credits remaining. Please top up to continue verifying.
        </p>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">{result.email}</span>
            <StatusBadge status={result.status} />
          </div>
          <div className="text-gray-600">
            Score:{" "}
            <span className="font-medium">
              {(result.score * 100).toFixed(0)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Check label="Syntax" ok={result.isSyntaxOk} />
            <Check label="MX Record" ok={result.isMxValid} />
            <Check label="Not Disposable" ok={!result.isDisposable} />
            <Check label="Not Role-based" ok={!result.isRoleEmail} />
          </div>
        </div>
      )}
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

function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-1 text-gray-600">
      <span className={ok ? "text-green-500" : "text-red-400"}>
        {ok ? "✓" : "✗"}
      </span>
      {label}
    </div>
  );
}
