"use client";
import React, { useEffect } from "react";
import { AdminForm, useAuth } from "@/components/Admin";
import { useRouter } from "next/navigation";

export default function AdminAuthPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/admin/dashboard");
    }
  }, [isLoggedIn, router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Admin Portal</h1>
        </div>
        <AdminForm />

        {/* Footer Note */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
