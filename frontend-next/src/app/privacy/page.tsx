import Link from "next/link";
import { SubKeepLogo } from "@/components/logo";

export default function PrivacyPage() {
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
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 15, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly: email address, password, and subscription details (service names, amounts, billing dates). We may also collect SMS/notification data if you use the detection feature.</p>

        <h2>2. How We Use Your Information</h2>
        <p>Your data is used solely to provide and improve the Service: tracking subscriptions, sending reminders, generating analytics, and detecting new subscriptions from messages.</p>

        <h2>3. Data Storage & Security</h2>
        <p>Your data is stored on encrypted servers. We use industry-standard security measures including HTTPS encryption, encrypted password storage (bcrypt), and regular security audits.</p>

        <h2>4. Data Sharing</h2>
        <p>We never sell your personal data. We may share anonymized, aggregated data for analytics purposes. We will disclose data only if required by law.</p>

        <h2>5. Your Rights</h2>
        <p>You can access, update, or delete your data at any time through your account settings. You can export your data or request complete account deletion by contacting us.</p>

        <h2>6. Cookies</h2>
        <p>We use essential cookies for authentication and session management. No tracking cookies are used without your consent.</p>

        <h2>7. Contact</h2>
        <p>For privacy-related inquiries, contact us at privacy@subkeep.app.</p>
      </div>
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SubKeep. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
