import Link from "next/link";
import { SubKeepLogo } from "@/components/logo";

const plans = [
  { name: "Free", price: "₹0", desc: "For individuals getting started", features: ["Up to 5 subscriptions", "Monthly spending view", "Email reminders", "Basic analytics"] },
  { name: "Pro", price: "₹199", desc: "For power users", features: ["Unlimited subscriptions", "SMS detection", "AI insights", "All analytics", "Priority support"], popular: true },
  { name: "Family", price: "₹499", desc: "For families & teams", features: ["Everything in Pro", "Up to 5 members", "Shared dashboard", "Expense splitting", "API access"], popular: false },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SubKeepLogo className="w-6 h-6" />
            <span className="font-bold">SubKeep</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">Get Started</Link>
          </div>
        </div>
      </header>
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Start free, upgrade when you need more</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`p-6 rounded-xl border ${plan.popular ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"} hover:shadow-lg transition-shadow relative`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">Most Popular</div>}
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border hover:bg-accent"}`}>
                {plan.name === "Free" ? "Get Started" : "Subscribe"}
              </Link>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t bg-card mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SubKeep. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
