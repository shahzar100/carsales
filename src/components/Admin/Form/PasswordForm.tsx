"use client";
import React, { useState, useMemo, useCallback } from "react";
import Form, { FormStep } from "../../Form/Form";
import {
  FormInput,
  SummaryRow,
  SummaryCard,
  SelectionCard,
  InfoBanner,
  Badge,
} from "../../Form/FormPrimitives";
import { KeyRound, Search, ClipboardList, Mail } from "lucide-react";
import Button from "@/components/Helpful/Buttons/Button";

// ── Types ────────────────────────────────────────────────────
type PasswordAction = "reset" | "reminder" | "";

interface PasswordFormData {
  action: PasswordAction;
  identifier: string; // username or email used to look up user
}

interface FoundUser {
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
  return <Badge colour={c.colour}>{c.label}</Badge>;
};

// ═════════════════════════════════════════════════════════════
// PasswordForm – Reset or send a reminder for an admin user
// ═════════════════════════════════════════════════════════════
const PasswordForm = () => {
  const [data, setData] = useState<PasswordFormData>({
    action: "",
    identifier: "",
  });

  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  // Result state — both actions email a reset link; nothing to copy.
  const [done, setDone] = useState(false);

  const update = <K extends keyof PasswordFormData>(
    field: K,
    value: PasswordFormData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Clear lookup when identifier changes
    if (field === "identifier") {
      setFoundUser(null);
      setLookupError("");
    }
  };

  // ── User lookup ────────────────────────────────────────────
  // useCallback so the steps useMemo doesn't re-run on every render.
  const lookupUser = useCallback(async () => {
    if (!data.identifier.trim()) return;
    setLookingUp(true);
    setLookupError("");
    setFoundUser(null);

    try {
      const res = await fetch(
        `/api/admin/users/lookup?q=${encodeURIComponent(data.identifier.trim())}`
      );
      const result = await res.json();

      if (!res.ok) {
        setLookupError(result.error || "User not found");
        return;
      }

      setFoundUser(result.user);
    } catch {
      setLookupError("Failed to look up user. Please try again.");
    } finally {
      setLookingUp(false);
    }
  }, [data.identifier]);

  // ── Steps ──────────────────────────────────────────────────
  const steps: FormStep[] = useMemo(
    () => [
      // ── Step 1: Choose Action ─────────────────────────────
      {
        title: "Choose Action",
        description: "What would you like to do?",
        icon: <KeyRound className="h-5 w-5" />,
        validate: () => {
          if (!data.action) return "Please select an action";
          return true;
        },
        content: (
          <div role="radiogroup" aria-label="Password action" className="grid gap-4 sm:grid-cols-2">
            <SelectionCard
              selected={data.action === "reset"}
              onSelect={() => update("action", "reset")}
              title="Reset Password"
              description="Email the user a secure password-reset link"
              items={[
                "Sends a reset email to the user",
                "Link expires after 1 hour",
                "The user sets their own new password",
              ]}
              activeColour="border-red-500 bg-red-50/50"
            />
            <SelectionCard
              selected={data.action === "reminder"}
              onSelect={() => update("action", "reminder")}
              title="Password Reminder"
              description="Send a reminder email to the user"
              items={[
                "Sends email to user's address",
                "Includes a secure reset link",
                "Link expires after 1 hour",
              ]}
              activeColour="border-gray-500 bg-gray-50/50"
            />
          </div>
        ),
      },

      // ── Step 2: Find User ─────────────────────────────────
      {
        title: "Find User",
        description: "Search by username or email address",
        icon: <Search className="h-5 w-5" />,
        validate: () => {
          if (!data.identifier.trim())
            return "Please enter a username or email";
          if (!foundUser) return "Please look up and verify the user first";
          if (data.action === "reminder" && !foundUser.email)
            return "This user has no email address. Use Reset Password instead.";
          return true;
        },
        content: (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <FormInput
                  label="Username or Email"
                  value={data.identifier}
                  onChange={(v) => update("identifier", v)}
                  placeholder="e.g. jsmith or john@example.com"
                  required
                />
              </div>
              <Button
                type="button"
                onClick={lookupUser}
                disabled={!data.identifier.trim()}
                loading={lookingUp}
              >
                {!lookingUp && <Search className="h-4 w-4" />}
                {lookingUp ? "Searching…" : "Look Up"}
              </Button>
            </div>

            {lookupError && (
              <InfoBanner variant="error">{lookupError}</InfoBanner>
            )}

            {foundUser && (
              <div className="space-y-3">
                <InfoBanner variant="success">
                  User found — confirm the details below are correct.
                </InfoBanner>

                {data.action === "reminder" && !foundUser.email && (
                  <InfoBanner variant="error">
                    This user has no email address on file. A password reminder
                    cannot be sent. Use{" "}
                    <span className="font-medium">Reset Password</span> instead.
                  </InfoBanner>
                )}
                <SummaryCard title="User Found">
                  <SummaryRow label="Username" value={foundUser.username} />
                  <SummaryRow label="Email" value={foundUser.email} />
                  <SummaryRow label="Role">
                    {roleBadge(foundUser.role)}
                  </SummaryRow>
                </SummaryCard>
              </div>
            )}
          </div>
        ),
      },

      // ── Step 3: Review & Submit ───────────────────────────
      {
        title: "Review & Submit",
        description: "Confirm and proceed",
        icon: <ClipboardList className="h-5 w-5" />,
        content: (
          <div className="space-y-5">
            {done ? (
              <InfoBanner variant="success">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-medium">Reset email sent.</span> A
                    secure password-reset link has been sent to{" "}
                    <span className="font-medium">{foundUser?.email}</span>. It
                    expires in 1 hour, and the user sets their own new password
                    from it.
                  </div>
                </div>
              </InfoBanner>
            ) : (
              <>
                <SummaryCard
                  title={
                    data.action === "reset"
                      ? "Password Reset"
                      : "Password Reminder"
                  }
                >
                  <SummaryRow
                    label="Action"
                    value={
                      data.action === "reset"
                        ? "Reset Password"
                        : "Send Reminder Email"
                    }
                  />
                  <SummaryRow
                    label="Username"
                    value={foundUser?.username || "—"}
                  />
                  <SummaryRow label="Email" value={foundUser?.email || "—"} />
                  <SummaryRow label="Role">
                    {roleBadge(foundUser?.role || "")}
                  </SummaryRow>
                </SummaryCard>

                <InfoBanner variant="info">
                  <span className="font-medium">Note:</span> A secure
                  password-reset link will be emailed to{" "}
                  <span className="font-medium">{foundUser?.email}</span>. Their
                  current password stays active until they use the link to set a
                  new one.
                </InfoBanner>
              </>
            )}
          </div>
        ),
      },
    ],
    [data, foundUser, lookingUp, lookupError, done, lookupUser]
  );

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!foundUser) throw new Error("No user selected");

    const res = await fetch("/api/admin/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: data.action,
        username: foundUser.username,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Action failed");
    }

    // Both "reset" and "reminder" email the user a secure reset link —
    // no password is generated or returned.
    setDone(true);
  };

  const submitLabel = "Send Reset Email";

  return (
    <Form steps={steps} onSubmit={handleSubmit} submitLabel={submitLabel} />
  );
};

export default PasswordForm;
