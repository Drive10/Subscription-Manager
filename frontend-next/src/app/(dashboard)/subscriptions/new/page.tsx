"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { popularServices } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { ChevronLeft, Sparkles, Loader2, Check } from "lucide-react";
import Link from "next/link";

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    billingCycle: "monthly",
    nextBillingDate: "",
    category: "Entertainment",
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    setMounted(true);
    // Set default date to today + 30 days
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      nextBillingDate: nextMonth.toISOString().split("T")[0],
    }));
  }, [router]);

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    if (value.length > 0) {
      const filtered = popularServices.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createSubscription({
        name: formData.name,
        amount: parseInt(formData.amount),
        billingCycle: formData.billingCycle,
        nextBillingDate: new Date(formData.nextBillingDate).toISOString(),
        category: formData.category,
      });
      router.push("/subscriptions");
    } catch (error) {
      console.error("Failed to create subscription:", error);
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/subscriptions"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to subscriptions
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Subscription</CardTitle>
          <CardDescription>
            Add a new subscription to track your spending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name with Suggestions */}
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="e.g., Netflix, Spotify"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (formData.name) {
                      handleNameChange(formData.name);
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Sparkles className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </button>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg">
                    {suggestions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, name: service }));
                          setShowSuggestions(false);
                        }}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {service}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount and Billing Cycle */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, billingCycle: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Next Billing Date and Category */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nextBillingDate">Next Billing Date</Label>
                <Input
                  id="nextBillingDate"
                  type="date"
                  value={formData.nextBillingDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nextBillingDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Productivity">Productivity</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            {formData.name && formData.amount && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">Summary</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formData.name}</span>
                  <span className="text-lg font-bold">
                    ₹{Number(formData.amount).toLocaleString()}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{formData.billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Subscription
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}