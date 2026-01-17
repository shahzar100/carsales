import React from "react";
import AdminForm from "@/components/Admin/AdminForm";

export default function AdminAuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Admin Portal</h1>
        </div>
        <AdminForm />

        {/* Footer Note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}
