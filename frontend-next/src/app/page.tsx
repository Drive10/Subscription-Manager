import Link from "next/link";
import { SubKeepLogo } from "@/components/logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SubKeepLogo className="w-8 h-8" />
            <span className="text-xl font-bold">SubKeep</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-medium mb-6">
          🚀 Trusted by 10,000+ subscribers
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Never miss a{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            subscription payment
          </span>{" "}
          again
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Track, manage, and optimize all your subscriptions in one place. 
          Get reminders, smart insights, and take control of your spending.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-base font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            Start Free Trial
          </Link>
          <Link href="#features" className="inline-flex items-center justify-center rounded-lg border px-6 py-3 text-base font-medium hover:bg-accent transition-colors">
            See Features
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          <div>
            <p className="text-3xl font-bold">10K+</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div>
            <p className="text-3xl font-bold">50K+</p>
            <p className="text-sm text-muted-foreground">Subscriptions</p>
          </div>
          <div>
            <p className="text-3xl font-bold">₹2Cr+</p>
            <p className="text-sm text-muted-foreground">Tracked Spend</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to manage subscriptions</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Smart tools to track, analyze, and optimize your recurring expenses</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { title: "Smart Detection", desc: "Automatically detect subscriptions from SMS and bank messages using AI", icon: "🤖" },
            { title: "Visual Analytics", desc: "Beautiful charts and insights to understand your spending patterns", icon: "📊" },
            { title: "Renewal Reminders", desc: "Get notified before every payment with customizable reminders", icon: "🔔" },
            { title: "Category Tracking", desc: "Organize subscriptions by category and see where your money goes", icon: "🏷️" },
            { title: "Multi-currency", desc: "Support for INR, USD, EUR and more with automatic conversion", icon: "💱" },
            { title: "Budget Insights", desc: "AI-powered recommendations to optimize your subscription spend", icon: "💡" },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Start free, upgrade when you need more</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Free", price: "₹0", desc: "For individuals getting started", features: ["Up to 5 subscriptions", "Monthly spending view", "Email reminders", "Basic analytics"] },
            { name: "Pro", price: "₹199", desc: "For power users", features: ["Unlimited subscriptions", "SMS detection", "AI insights", "All analytics", "Priority support"], popular: true },
            { name: "Family", price: "₹499", desc: "For families & teams", features: ["Everything in Pro", "Up to 5 members", "Shared dashboard", "Expense splitting", "API access"], popular: false },
          ].map((plan) => (
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

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { q: "How does SMS detection work?", a: "SubKeep uses AI to analyze your SMS and bank notifications to automatically detect subscription payments. You review and confirm before adding." },
            { q: "Can I track subscriptions in different currencies?", a: "Yes! SubKeep supports multiple currencies including INR, USD, EUR, and GBP with approximate conversions." },
            { q: "Is my financial data secure?", a: "Absolutely. We use industry-standard encryption, never store your bank credentials, and all data is transmitted over HTTPS." },
            { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your data will remain accessible for the current billing period." },
          ].map((faq) => (
            <details key={faq.q} className="group p-4 rounded-lg border bg-card">
              <summary className="flex items-center justify-between cursor-pointer font-medium">
                {faq.q}
                <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <SubKeepLogo className="w-6 h-6" />
                <span className="font-bold">SubKeep</span>
              </div>
              <p className="text-sm text-muted-foreground">Track, manage, and optimize your subscriptions. Take control of your recurring expenses.</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><span className="cursor-default">Contact: hello@subkeep.app</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SubKeep. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
