"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SectionCard, EmptyState, LoadingSpinner } from "@/components/admin/AdminComponents";

interface Voucher {
  id: string;
  code: string;
  title: string;
  examId: string;
  exam: { id: string; title: string };
  maxUsage: number;
  usedCount: number;
  isActive: boolean;
  expiredAt: string | null;
  createdAt: string;
  redemptions: { id: string; userId: string; user: { name: string; email: string } }[];
}

interface Exam {
  id: string;
  title: string;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [generating, setGenerating] = useState(false);

  // Single voucher form
  const [form, setForm] = useState({
    code: "",
    title: "",
    examId: "",
    maxUsage: 1,
    expiredAt: "",
  });

  // Batch voucher form
  const [batchForm, setBatchForm] = useState({
    prefix: "VCH",
    title: "",
    examId: "",
    count: 10,
    maxUsage: 1,
    expiredAt: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vouchersRes, examsRes] = await Promise.all([
        fetch("/api/admin/vouchers"),
        fetch("/api/admin/exams"),
      ]);
      const vouchersData = await vouchersRes.json();
      const examsData = await examsRes.json();
      setVouchers(vouchersData);
      setExams(examsData);
    } catch (error) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.code || !form.title || !form.examId) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create");

      setShowModal(false);
      setForm({ code: "", title: "", examId: "", maxUsage: 1, expiredAt: "" });
      fetchData();
    } catch (error) {
      alert("Failed to create voucher");
    }
  };

  const handleBatchCreate = async () => {
    if (!batchForm.examId || !batchForm.prefix) {
      alert("Please fill all required fields");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm),
      });

      if (!res.ok) throw new Error("Failed to generate");

      setShowBatchModal(false);
      setBatchForm({ prefix: "VCH", title: "", examId: "", count: 10, maxUsage: 1, expiredAt: "" });
      fetchData();
    } catch (error) {
      alert("Failed to generate vouchers");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !voucher.isActive }),
      });
      fetchData();
    } catch (error) {
      alert("Failed to update voucher");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this voucher?")) return;

    try {
      await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      alert("Failed to delete voucher");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied!");
  };

  if (loading) {
    return <LoadingSpinner message="Loading vouchers..." />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-gray-600">Manage exam access vouchers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBatchModal(true)}>
            📦 Generate Batch
          </Button>
          <Button onClick={() => setShowModal(true)}>
            + Create Voucher
          </Button>
        </div>
      </div>

      {vouchers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon="🎫"
              title="No vouchers yet"
              description="Create vouchers to give users access to exams"
              action={<Button onClick={() => setShowModal(true)}>Create Voucher</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vouchers.map((voucher) => {
            const isExpired = voucher.expiredAt && new Date(voucher.expiredAt) < new Date();
            const isMaxed = voucher.usedCount >= voucher.maxUsage;

            return (
              <Card key={voucher.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <button
                          onClick={() => copyToClipboard(voucher.code)}
                          className="px-3 py-1 bg-gray-100 rounded font-mono text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                          {voucher.code} 📋
                        </button>
                        <Badge variant={voucher.isActive ? "success" : "danger"}>
                          {voucher.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {isExpired && <Badge variant="danger">Expired</Badge>}
                        {isMaxed && <Badge variant="warning">Maxed</Badge>}
                      </div>
                      <p className="font-medium text-gray-900">{voucher.title}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        <span>📝 {voucher.exam.title}</span>
                        <span>👥 {voucher.usedCount}/{voucher.maxUsage} used</span>
                        {voucher.expiredAt && (
                          <span>📅 Expires: {new Date(voucher.expiredAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVoucher(voucher);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(voucher)}
                      >
                        {voucher.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(voucher.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold mb-4">Create Voucher</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SPECIAL2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Summer Promo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam *</label>
                <select
                  value={form.examId}
                  onChange={(e) => setForm({ ...form, examId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage</label>
                  <Input
                    type="number"
                    value={form.maxUsage}
                    onChange={(e) => setForm({ ...form, maxUsage: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                  <Input
                    type="date"
                    value={form.expiredAt}
                    onChange={(e) => setForm({ ...form, expiredAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Generate Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowBatchModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold mb-4">Generate Batch Vouchers</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam *</label>
                <select
                  value={batchForm.examId}
                  onChange={(e) => setBatchForm({ ...batchForm, examId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>{exam.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                  <Input
                    value={batchForm.prefix}
                    onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="VCH"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                  <Input
                    type="number"
                    value={batchForm.count}
                    onChange={(e) => setBatchForm({ ...batchForm, count: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={100}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage (each)</label>
                  <Input
                    type="number"
                    value={batchForm.maxUsage}
                    onChange={(e) => setBatchForm({ ...batchForm, maxUsage: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                  <Input
                    type="date"
                    value={batchForm.expiredAt}
                    onChange={(e) => setBatchForm({ ...batchForm, expiredAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowBatchModal(false)}>Cancel</Button>
              <Button onClick={handleBatchCreate} disabled={generating}>
                {generating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}