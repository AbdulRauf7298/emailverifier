"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      await update({ name });
      setMessage("Profile updated successfully!");
    } else {
      setMessage("Failed to update profile.");
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{session?.user?.name}</p>
            <p className="text-gray-500 text-sm">{session?.user?.email}</p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg text-sm ${
              message.includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (read-only)
            </label>
            <input
              type="email"
              value={session?.user?.email ?? ""}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
