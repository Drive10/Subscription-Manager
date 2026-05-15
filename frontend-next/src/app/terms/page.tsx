import Link from "next/link";
import { SubKeepLogo } from "@/components/logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SubKeepLogo className="w-6 h-6" />
            <span className="font-bold">SubKeep</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
        </div>
      </header>
      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-sm md:prose-base dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: May 15, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using SubKeep (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>SubKeep provides a subscription management platform that allows users to track, analyze, and manage their recurring subscriptions. The Service includes features such as SMS detection, analytics, reminders, and reporting.</p>

        <h2>3. User Responsibilities</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate information during registration.</p>

        <h2>4. Data Privacy</h2>
        <p>We take your privacy seriously. Please refer to our <Link href="/privacy">Privacy Policy</Link> for information on how we collect, use, and protect your data.</p>

        <h2>5. Payment Terms</h2>
        <p>Paid plans are billed monthly or annually as selected. You may cancel at any time. Refunds are provided at our discretion for unused portions of paid plans.</p>

        <h2>6. Limitation of Liability</h2>
        <p>SubKeep is provided &ldquo;as is&rdquo; without warranties of any kind. We are not responsible for any financial decisions you make based on the data provided by the Service.</p>

        <h2>7. Changes to Terms</h2>
        <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or in-app notification.</p>

        <h2>8. Contact</h2>
        <p>For questions about these terms, contact us at hello@subkeep.app.</p>
      </div>
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SubKeep. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
