"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RedeemVoucherPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ examId: string; examTitle: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to redeem voucher");
      }

      setSuccess({
        examId: data.examId,
        examTitle: data.examTitle,
        message: data.message,
      });
      setCode("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-3xl mb-4">
            🎫
          </div>
          <CardTitle className="text-2xl">Redeem Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl mb-4">
                ✅
              </div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">Success!</h3>
              <p className="text-gray-600 mb-4">{success.message}</p>
              <p className="font-medium text-gray-900 mb-6">{success.examTitle}</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSuccess(null);
                    setCode("");
                  }}
                >
                  Redeem Another
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/exam/${success.examId}`)}
                >
                  Start Exam
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-gray-600 mb-4 text-center">
                  Enter your voucher code below to unlock exam access.
                </p>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className="text-center text-lg font-mono tracking-wider"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!code.trim() || loading}
              >
                {loading ? "Redeeming..." : "Redeem Voucher"}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                Have a voucher code? Enter it above to access premium exams.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}