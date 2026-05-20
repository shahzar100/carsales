"use client";
import React, { useState, useMemo } from "react";
import Form, { FormStep } from "../../Form/Form";
import {
  SummaryRow,
  SummaryCard,
  FormInput,
  Badge,
  InfoBanner,
  SelectionCard,
} from "../../Form/FormPrimitives";
import { UserRound, ShieldCheck, ClipboardList } from "lucide-react";

// ── Form data shape ──────────────────────────────────────────
interface UserFormData {
  username: string;
  email: string;
  role: string;
}

// ── Helpers ──────────────────────────────────────────────────
const roleBadge = (role: string) => {
  const config: Record<
    string,
    { colour: "red" | "amber" | "blue"; label: string }
  > = {
    admin: { colour: "red", label: "Admin" },
    manager: { colour: "amber", label: "Manager" },
    staff: { colour: "blue", label: "Staff" },
  };
  const c = config[role];
  if (!c) return <span className="text-sm text-gray-400">—</span>;
  return (
    <Badge colour={c.colour} icon={<ShieldCheck className="h-3 w-3" />}>
      {c.label}
    </Badge>
  );
};

// ═════════════════════════════════════════════════════════════
// UserForm – Admin user creation with privilege levels
// The system generates a strong password automatically
// ═════════════════════════════════════════════════════════════
const UserForm = () => {
  const [data, setData] = useState<UserFormData>({
    username: "",
    email: "",
    role: "",
  });
  const [isCreated, setIsCreated] = useState(false);

  const update = (field: keyof UserFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const steps: FormStep[] = useMemo(
    () => [
      // ── Step 1: Account Info ──────────────────────────────
      {
        title: "Account Details",
        description: "Choose a username for the new admin user",
        icon: <UserRound className="h-5 w-5" />,
        validate: () => {
          if (!data.username.trim()) return "Username is required";
          if (data.username.length < 3)
            return "Username must be at least 3 characters";
          if (!/^[a-zA-Z0-9_]+$/.test(data.username))
            return "Username can only contain letters, numbers, and underscores";
          if (!data.email.trim()) return "Email is required";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
            return "Please enter a valid email address";
          return true;
        },
        content: (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="Username"
                value={data.username}
                onChange={(v) => update("username", v)}
                placeholder="e.g. jsmith"
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={data.email}
                onChange={(v) => update("email", v)}
                placeholder="e.g. john@example.com"
                required
              />
            </div>
            <InfoBanner>
              <strong>Note:</strong> When you submit, the new user is emailed a
              secure link to set their own password — no password is shown
              here or stored in plain text.
            </InfoBanner>
          </div>
        ),
      },

      // ── Step 2: Role ──────────────────────────────────────
      {
        title: "Privilege Level",
        description: "Choose the user's access level",
        icon: <ShieldCheck className="h-5 w-5" />,
        validate: () => {
          if (!data.role) return "Please select a privilege level";
          return true;
        },
        content: (
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectionCard
              selected={data.role === "staff"}
              onSelect={() => update("role", "staff")}
              title="Staff"
              description="Basic access for day-to-day operations"
              items={[
                "View car listings",
                "View bookings",
                "View customer info",
              ]}
              activeColour="border-gray-500 bg-gray-50/50"
            />
            <SelectionCard
              selected={data.role === "manager"}
              onSelect={() => update("role", "manager")}
              title="Manager"
              description="Manage inventory, bookings & customers"
              items={[
                "All Staff permissions",
                "Add & edit cars",
                "Manage bookings",
                "Manage appointments",
              ]}
              activeColour="border-amber-500 bg-amber-50/50"
            />
            <SelectionCard
              selected={data.role === "admin"}
              onSelect={() => update("role", "admin")}
              title="Admin"
              description="Full system access — main administrator"
              items={[
                "All Manager permissions",
                "Create & remove users",
                "Change privilege levels",
                "System settings",
              ]}
              activeColour="border-red-500 bg-red-50/50"
            />
          </div>
        ),
      },

      // ── Step 3: Review ────────────────────────────────────
      {
        title: "Review & Submit",
        description: "Confirm details — a password will be generated on submit",
        icon: <ClipboardList className="h-5 w-5" />,
        content: (
          <div className="space-y-5">
            {isCreated ? (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
                <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h4 className="mb-1 text-lg font-semibold text-emerald-800">
                  User created
                </h4>
                <p className="text-sm text-emerald-700">
                  A setup email has been sent to{" "}
                  <span className="font-semibold">{data.email}</span>. They use
                  the secure link in it to set their own password — no password
                  is shown here.
                </p>
              </div>
            ) : (
              <>
                <SummaryCard title="New Admin User">
                  <SummaryRow label="Username" value={data.username} />
                  <SummaryRow label="Email" value={data.email} />
                  <SummaryRow label="Role">{roleBadge(data.role)}</SummaryRow>
                  <SummaryRow
                    label="Password"
                    value="Set by the user via emailed link"
                  />
                </SummaryCard>

                {data.role && (
                  <InfoBanner
                    variant={
                      data.role === "admin"
                        ? "error"
                        : data.role === "manager"
                          ? "warning"
                          : "info"
                    }
                  >
                    <span className="font-medium">
                      {data.role.charAt(0).toUpperCase() + data.role.slice(1)}
                    </span>{" "}
                    users{" "}
                    {data.role === "admin"
                      ? "have full access to the entire system including user management and settings."
                      : data.role === "manager"
                        ? "can manage cars, bookings, and appointments but cannot manage other users."
                        : "have view-only access and cannot make changes to the system."}
                  </InfoBanner>
                )}
              </>
            )}
          </div>
        ),
      },
    ],
    [data, isCreated]
  );

  const handleSubmit = async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        role: data.role,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to create user");
    }

    setIsCreated(true);
  };

  return (
    <Form steps={steps} onSubmit={handleSubmit} submitLabel="Create User" />
  );
};

export default UserForm;
