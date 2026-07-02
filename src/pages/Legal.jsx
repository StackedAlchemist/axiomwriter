import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Feather } from 'lucide-react'

/**
 * Public legal pages: Terms of Service and Privacy Policy.
 * Linked from Signup; both are reachable without an account.
 */

const LAST_UPDATED = 'July 2, 2026'
const CONTACT_EMAIL = 'stackedalchemist@gmail.com'

function LegalShell({ title, children }) {
  return (
    <div className="min-h-screen bg-axiom-bg text-slate-300">
      <header className="border-b border-axiom-border bg-axiom-surface">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-gold-400 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Axiomwriter
          </Link>
          <div className="flex items-center gap-2 text-slate-500">
            <Feather className="w-4 h-4" />
            <span className="font-serif font-semibold text-slate-300">Axiomwriter</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl font-semibold text-slate-100 mb-2">{title}</h1>
        <p className="text-xs text-slate-600 mb-8">
          Last updated: {LAST_UPDATED} · Axiomwriter is operated by Stacked Alchemist LLC
        </p>
        <div className="space-y-8 text-sm leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-100 [&_h2]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-3 [&_strong]:text-slate-200">
          {children}
        </div>

        <div className="mt-12 pt-6 border-t border-axiom-border flex items-center justify-between text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Stacked Alchemist LLC</span>
          <span className="flex gap-4">
            <Link to="/terms" className="hover:text-gold-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
          </span>
        </div>
      </main>
    </div>
  )
}

// ── Terms of Service ──────────────────────────────────────────────────────────
export function Terms() {
  return (
    <LegalShell title="Terms of Service">
      <section>
        <h2>1. Who we are and what this covers</h2>
        <p>
          Axiomwriter (<strong>axiomwriter.com</strong>) is a writing platform for authors, operated by
          Stacked Alchemist LLC ("Axiomwriter," "we," "us"). These Terms of Service govern your use of
          the Axiomwriter application and website. By creating an account or using the service, you
          agree to these terms. If you do not agree, do not use the service.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <ul>
          <li>You must be at least 13 years old to create an account.</li>
          <li>You are responsible for keeping your login credentials secure and for all activity under your account.</li>
          <li>Provide accurate account information and keep it up to date.</li>
          <li>One person per account. Accounts may not be shared or resold.</li>
        </ul>
      </section>

      <section>
        <h2>3. Your writing belongs to you</h2>
        <p>
          <strong>You own everything you create in Axiomwriter</strong> — your manuscripts, characters,
          world-building notes, maps, covers, and all other content you upload or write ("Your Content").
          We claim no ownership of it, ever.
        </p>
        <p>
          You grant us a limited license to store, back up, display, and process Your Content
          <strong> solely to operate the service for you</strong> — for example, saving your work to our
          database, syncing it across your devices, rendering it in the editor, generating your exports,
          and processing it through AI features when you invoke them. This license ends when you delete
          your content or your account, except for residual copies in routine backups, which expire on
          their own schedule.
        </p>
        <p>
          <strong>We do not use Your Content to train AI models</strong>, and we do not sell, license, or
          share it with third parties except the service providers described in our Privacy Policy, and
          only as needed to run the service.
        </p>
      </section>

      <section>
        <h2>4. AI features</h2>
        <ul>
          <li>
            AI features (writing suggestions, entity detection, structural analysis, image generation,
            and similar) send relevant excerpts of Your Content to our AI provider (Anthropic) for
            processing when — and only when — you use those features.
          </li>
          <li>
            AI output can be wrong, inconsistent, or unsuitable. You are responsible for reviewing
            anything AI-generated before relying on or publishing it.
          </li>
          <li>
            To the extent we hold any rights in AI-generated output produced from your prompts and
            content, we assign them to you. Treat AI output like a draft from an assistant: yours to
            keep, edit, or discard.
          </li>
          <li>AI usage is metered by subscription tier and resets monthly. Limits are shown in the app.</li>
        </ul>
      </section>

      <section>
        <h2>5. Subscriptions and billing</h2>
        <ul>
          <li>
            Axiomwriter offers a free tier and paid subscriptions (currently Writer, Composer, and
            Architect). Current pricing and tier features are shown in the app at the time of purchase.
          </li>
          <li>Payments are processed by <strong>Stripe</strong>. We never see or store your full card details.</li>
          <li>
            First-time subscribers get a <strong>7-day free trial</strong>. You won't be charged until
            the trial ends, and canceling during the trial costs nothing. The trial applies once per
            account.
          </li>
          <li>
            Paid plans renew automatically each billing period until canceled. You can cancel anytime
            from Settings → Manage Billing; your plan stays active until the end of the period you've
            paid for, then downgrades to the free tier. Your content is not deleted on downgrade.
          </li>
          <li>
            Except where required by law, fees for a billing period already started are non-refundable —
            but if something went wrong (double charge, billing error, the service failed you), contact
            us at {CONTACT_EMAIL} within 14 days and we will make it right.
          </li>
          <li>If prices change, we will notify you at least 30 days before your plan renews at a new price.</li>
        </ul>
      </section>

      <section>
        <h2>6. Acceptable use</h2>
        <p>Don't use Axiomwriter to:</p>
        <ul>
          <li>break the law, or store or distribute content that is illegal where you or we operate;</li>
          <li>infringe someone else's copyright, trademark, or other rights;</li>
          <li>attempt to breach, probe, or overload our systems, or access another user's account or data;</li>
          <li>circumvent subscription limits, resell access, or use automated tools to extract the service's functionality;</li>
          <li>harass, defame, or harm others.</li>
        </ul>
        <p>
          Fiction is fiction — dark themes, violence, and difficult subject matter in your creative work
          are yours to write. This section is about conduct, not censoring your stories.
        </p>
      </section>

      <section>
        <h2>7. Leaving, and our right to suspend</h2>
        <ul>
          <li>
            You can export your work (DOCX, PDF, and other formats) and delete your account at any time.
          </li>
          <li>
            We may suspend or terminate accounts that violate these terms. Unless the violation makes it
            unreasonable, we will warn you first and give you a chance to export your content.
          </li>
          <li>If we ever discontinue the service, we will give you at least 30 days' notice to export your work.</li>
        </ul>
      </section>

      <section>
        <h2>8. Disclaimers</h2>
        <p>
          The service is provided <strong>"as is."</strong> We work hard to keep it fast, correct, and
          available, but we can't guarantee it will be uninterrupted or error-free. We keep backups, but
          you should also keep your own copies of work that matters to you — the export tools exist for
          exactly that reason.
        </p>
      </section>

      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Stacked Alchemist LLC's total liability for any claims
          arising from or related to the service is limited to the amount you paid us in the twelve (12)
          months before the claim arose. We are not liable for indirect, incidental, special, or
          consequential damages, including lost profits or lost data (see Section 8 on keeping exports).
        </p>
      </section>

      <section>
        <h2>10. Changes to these terms</h2>
        <p>
          We may update these terms as the service evolves. For material changes we will notify you in
          the app or by email before they take effect. Continuing to use the service after changes take
          effect means you accept them.
        </p>
      </section>

      <section>
        <h2>11. Governing law and contact</h2>
        <p>
          These terms are governed by the laws of the State of Arizona and applicable United States
          federal law, without regard to conflict-of-law rules. Any disputes will be resolved in the
          state or federal courts located in Maricopa County, Arizona. Questions, disputes, or
          notices: <strong>{CONTACT_EMAIL}</strong>. We'd rather fix a problem than litigate one — write
          to us first.
        </p>
      </section>
    </LegalShell>
  )
}

// ── Privacy Policy ────────────────────────────────────────────────────────────
export function Privacy() {
  return (
    <LegalShell title="Privacy Policy">
      <section>
        <h2>1. The short version</h2>
        <ul>
          <li>Your manuscripts are yours. We don't read them, sell them, or train AI on them.</li>
          <li>We collect the minimum needed to run a writing app with accounts, sync, and billing.</li>
          <li>Card numbers go to Stripe, never to us.</li>
          <li>AI features send excerpts to Anthropic only when you use those features.</li>
          <li>No ads, no data brokers, no tracking across other sites.</li>
        </ul>
      </section>

      <section>
        <h2>2. What we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> email address, display name, and authentication
            credentials (managed by Firebase Authentication).
          </li>
          <li>
            <strong>Your Content:</strong> the manuscripts, characters, lore entries, maps, images, and
            other material you create or upload. Stored so the app can, well, store it.
          </li>
          <li>
            <strong>Subscription data:</strong> your tier, subscription status, and a Stripe customer
            ID. Full payment details (card numbers, billing address) are collected and held by Stripe,
            not by us.
          </li>
          <li>
            <strong>Usage data:</strong> word-count statistics, writing streaks, AI-assist counts, and
            feedback you submit through the in-app Feedback Hub.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use it</h2>
        <ul>
          <li>To provide the service: saving, syncing, and displaying your work across devices.</li>
          <li>To process AI requests you initiate (see Section 4).</li>
          <li>To manage your subscription and process payments through Stripe.</li>
          <li>To respond to support requests and feedback.</li>
          <li>To send service emails (password resets, billing notices, material changes to terms).</li>
        </ul>
        <p>We do not sell your personal information or your content. We do not serve ads.</p>
      </section>

      <section>
        <h2>4. AI processing</h2>
        <p>
          When you use an AI feature — writing suggestions, character detection, lore consistency
          checks, structural analysis, cover generation — the relevant excerpt of your content is sent
          to <strong>Anthropic</strong> (our AI provider) to generate the result, then returned to you.
          This happens only when you invoke an AI feature, never in the background.
        </p>
        <p>
          Under Anthropic's commercial API terms, content sent through the API is not used to train
          their models. We don't use your content to train anything either.
        </p>
      </section>

      <section>
        <h2>5. Who else touches your data (service providers)</h2>
        <ul>
          <li><strong>Google Firebase</strong> — authentication, database, file storage, and hosting.</li>
          <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
          <li><strong>Anthropic</strong> — AI processing, only when you use AI features.</li>
        </ul>
        <p>
          Each provider receives only what it needs for its job, and each is bound by its own security
          and privacy obligations. We don't share your data with anyone else except if legally compelled
          to, and where allowed we would tell you first.
        </p>
      </section>

      <section>
        <h2>6. Security and retention</h2>
        <ul>
          <li>Data is encrypted in transit (HTTPS/TLS) and protected by per-user access rules — your content is readable only by your account.</li>
          <li>We keep your data for as long as your account is active.</li>
          <li>
            When you delete content, it's removed from the live database; residual copies in routine
            backups expire on their own schedule.
          </li>
          <li>
            To delete your account and all associated data, email <strong>{CONTACT_EMAIL}</strong> from
            your account email — we'll confirm and complete the deletion.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <ul>
          <li><strong>Access and portability:</strong> export your work anytime with the built-in export tools.</li>
          <li><strong>Correction:</strong> update your account details in Settings.</li>
          <li><strong>Deletion:</strong> delete individual content in-app, or your whole account per Section 6.</li>
          <li>
            If you're in a region with specific privacy rights (GDPR, CCPA, and similar), you can
            exercise them by emailing {CONTACT_EMAIL}.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Cookies and local storage</h2>
        <p>
          We use browser storage for what an app needs to function: keeping you signed in, remembering
          preferences (theme, layout), and offline caching so the app works as a PWA. No third-party
          advertising or cross-site tracking cookies.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          Axiomwriter is not directed at children under 13, and we don't knowingly collect their data.
          If you believe a child under 13 has an account, contact us and we'll remove it.
        </p>
      </section>

      <section>
        <h2>10. Changes and contact</h2>
        <p>
          If this policy changes materially, we'll notify you in the app or by email before the change
          takes effect. Questions about your data: <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </section>
    </LegalShell>
  )
}
