"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Pencil,
  Trash2,
  Pause,
  Play,
} from "lucide-react";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: string;
  category: string;
  status: string;
}

type SortOption = "price-asc" | "price-desc" | "date-asc" | "date-desc" | "name";
type FilterOption = "all" | "monthly" | "yearly" | "active" | "paused";

export default function SubscriptionsPage() {
  const [mounted, setMounted] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setMounted(true);
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const data = await api.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSubscriptions = useMemo(() => {
    let result = [...subscriptions];

    if (filterBy !== "all") {
      switch (filterBy) {
        case "monthly":
          result = result.filter((s) => s.billingCycle === "monthly");
          break;
        case "yearly":
          result = result.filter((s) => s.billingCycle === "yearly");
          break;
        case "active":
          result = result.filter((s) => s.status === "active");
          break;
        case "paused":
          result = result.filter((s) => s.status === "paused");
          break;
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.category && s.category.toLowerCase().includes(query))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.amount - b.amount;
        case "price-desc":
          return b.amount - a.amount;
        case "date-asc":
          return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
        case "date-desc":
          return new Date(b.nextBillingDate).getTime() - new Date(a.nextBillingDate).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [subscriptions, searchQuery, sortBy, filterBy]);

  const getMonthlyAmount = (sub: Subscription) => {
    return sub.billingCycle === "monthly" ? sub.amount : Math.round(sub.amount / 12);
  };

  const getLogo = (name: string) => name.charAt(0).toUpperCase();

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your {subscriptions.length} subscriptions
          </p>
        </div>
        <Link href="/subscriptions/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Subscription
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Renewal Date (Newest)</SelectItem>
            <SelectItem value="date-asc">Renewal Date (Oldest)</SelectItem>
            <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            <SelectItem value="price-asc">Price (Low to High)</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscription Grid */}
      {filteredAndSortedSubscriptions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No subscriptions found</p>
          <Link href="/subscriptions/new">
            <Button variant="outline">Add your first subscription</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedSubscriptions.map((sub) => (
            <Card key={sub.id} className="relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      {getLogo(sub.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{sub.name}</h3>
                      <p className="text-sm text-muted-foreground">{sub.category || "Other"}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedSub(selectedSub === sub.id ? null : sub.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    {selectedSub === sub.id && (
                      <div className="absolute right-0 top-8 z-10 w-32 bg-card border rounded-lg shadow-lg py-1">
                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent">
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent">
                          {sub.status === "active" ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Resume
                            </>
                          )}
                        </button>
                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-accent">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="font-bold text-lg">
                      ₹{sub.amount.toLocaleString()}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{sub.billingCycle === "monthly" ? "mo" : "yr"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly</span>
                    <span className="text-sm">₹{getMonthlyAmount(sub).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next billing</span>
                    <span className="text-sm">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Badge
                    variant={sub.status === "active" ? "default" : "secondary"}
                    className={sub.status === "active" ? "bg-green-500/10 text-green-500" : ""}
                  >
                    {sub.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}