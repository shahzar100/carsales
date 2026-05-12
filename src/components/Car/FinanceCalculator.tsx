"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Info, MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

interface Props {
  price: number;
}

/**
 * (#29) Client-side monthly finance estimate.
 *
 * Indicative only — actual APR and terms depend on the customer's
 * credit profile and the lender we route to. The figure here is the
 * standard amortised monthly payment:
 *
 *   monthly = P * (r/12) / (1 - (1 + r/12)^-n)
 *
 * where P = price - deposit, r = APR/100, n = term (months).
 *
 * If APR is 0 we fall back to even monthly splits to avoid NaN. The
 * "Get a finance quote" CTA links to /Enquiry with the figures
 * pre-filled in the URL so admins know what the customer was looking
 * at when they ask for a quote.
 */
export default function FinanceCalculator({ price }: Props) {
  const minDeposit = Math.round(price * 0.1);
  const [deposit, setDeposit] = useState<number>(minDeposit);
  const [termMonths, setTermMonths] = useState<number>(48);
  const [apr, setApr] = useState<number>(9.9);

  const result = useMemo(() => {
    const principal = Math.max(0, price - deposit);
    if (principal === 0) {
      return { monthly: 0, total: deposit, totalInterest: 0 };
    }
    if (apr === 0) {
      const monthly = principal / termMonths;
      return {
        monthly,
        total: deposit + monthly * termMonths,
        totalInterest: 0,
      };
    }
    const r = apr / 100 / 12;
    const monthly = (principal * r) / (1 - Math.pow(1 + r, -termMonths));
    const total = deposit + monthly * termMonths;
    return {
      monthly,
      total,
      totalInterest: total - price,
    };
  }, [price, deposit, termMonths, apr]);

  const enquiryHref = `/Enquiry?subject=${encodeURIComponent(
    "Finance quote request"
  )}&price=${price}&deposit=${deposit}&term=${termMonths}&apr=${apr}`;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-gray-900">
        <Calculator className="h-5 w-5 text-red-600" />
        Finance Calculator
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Estimate your monthly payments. Get a personalised quote with no
        commitment.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="finance-deposit"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Deposit: {formatPrice(deposit)}
          </label>
          <input
            id="finance-deposit"
            type="range"
            min={0}
            max={price}
            step={100}
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="w-full accent-red-600"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum 10% recommended ({formatPrice(minDeposit)})
          </p>
        </div>

        <div>
          <label
            htmlFor="finance-term"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Term
          </label>
          <select
            id="finance-term"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
          >
            <option value={24}>2 years (24 months)</option>
            <option value={36}>3 years (36 months)</option>
            <option value={48}>4 years (48 months)</option>
            <option value={60}>5 years (60 months)</option>
            <option value={72}>6 years (72 months)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="finance-apr"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            APR: {apr.toFixed(1)}%
          </label>
          <input
            id="finance-apr"
            type="range"
            min={0}
            max={20}
            step={0.1}
            value={apr}
            onChange={(e) => setApr(Number(e.target.value))}
            className="w-full accent-red-600"
          />
          <p className="mt-1 text-xs text-gray-500">
            Typical: 7.9% – 12.9% depending on credit profile
          </p>
        </div>
      </div>

      {/* Result */}
      <div className="mt-6 rounded-xl bg-linear-to-br from-red-50 to-rose-50 p-5 ring-1 ring-red-100">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-red-700/80">
              Estimated monthly payment
            </p>
            <p className="text-3xl font-extrabold text-red-700">
              {formatPrice(Math.round(result.monthly))}
              <span className="ml-1 text-sm font-normal text-red-700/70">
                /mo
              </span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Total payable: {formatPrice(Math.round(result.total))}</p>
            <p>
              Interest:{" "}
              {formatPrice(Math.max(0, Math.round(result.totalInterest)))}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
        <p>
          Figures are estimates only and don&apos;t constitute a credit offer.
          Final APR depends on credit checks and lender criteria. Finance is
          subject to status.
        </p>
      </div>

      {/* CTAs */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          href={enquiryHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700"
        >
          <MessageCircle className="h-4 w-4" />
          Get a finance quote
        </Link>
        <a
          href={`tel:`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Speak to our team
        </a>
      </div>
    </div>
  );
}
