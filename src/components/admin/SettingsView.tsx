"use client";

export default function SettingsView() {
  return (
    <section className="admin-content">
      <div className="admin-tab-header">
        <h2 className="admin-h2">Account Settings</h2>
      </div>

      <div className="admin-settings-grid">
        {/* Credentials */}
        <div className="admin-settings-card">
          <div className="admin-settings-icon">
            <i className="fa-solid fa-lock" />
          </div>
          <h3>Admin Credentials</h3>
          <p>
            Login email and password are stored as environment variables. To update them, go to your{" "}
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
              Vercel project settings
            </a>{" "}
            and update the following variables:
          </p>
          <ul className="admin-settings-vars">
            <li><code>ADMIN_EMAIL</code> — admin login email</li>
            <li><code>ADMIN_PASSWORD</code> — admin login password</li>
            <li><code>AUTH_TOKEN</code> — session token (change to invalidate all sessions)</li>
          </ul>
          <p className="admin-settings-note">After updating, redeploy for changes to take effect.</p>
        </div>

        {/* Stripe */}
        <div className="admin-settings-card">
          <div className="admin-settings-icon stripe">
            <i className="fa-brands fa-stripe" />
          </div>
          <h3>Stripe Payments</h3>
          <p>Card payments via Stripe Checkout. Configure in Vercel:</p>
          <ul className="admin-settings-vars">
            <li><code>STRIPE_SECRET_KEY</code> — sk_live_… or sk_test_…</li>
            <li><code>STRIPE_WEBHOOK_SECRET</code> — whsec_… from Stripe Dashboard</li>
          </ul>
          <a
            className="admin-settings-link"
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" /> Open Stripe Dashboard
          </a>
        </div>

        {/* PayPal */}
        <div className="admin-settings-card">
          <div className="admin-settings-icon paypal">
            <i className="fa-brands fa-paypal" />
          </div>
          <h3>PayPal Payments</h3>
          <p>PayPal JS SDK embedded buttons. Configure in Vercel:</p>
          <ul className="admin-settings-vars">
            <li><code>PAYPAL_CLIENT_ID</code></li>
            <li><code>PAYPAL_CLIENT_SECRET</code></li>
            <li><code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> — exposed to browser</li>
          </ul>
          <a
            className="admin-settings-link"
            href="https://developer.paypal.com/dashboard/applications"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" /> Open PayPal Dashboard
          </a>
        </div>

        {/* Email */}
        <div className="admin-settings-card">
          <div className="admin-settings-icon email">
            <i className="fa-solid fa-envelope" />
          </div>
          <h3>Email (Resend)</h3>
          <p>Transactional emails sent via the Resend API. Configure in Vercel:</p>
          <ul className="admin-settings-vars">
            <li><code>RESEND_API_KEY</code> — re_…</li>
            <li><code>RESEND_SENDER</code> — e.g. info@uptura.net</li>
          </ul>
          <a
            className="admin-settings-link"
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fa-solid fa-arrow-up-right-from-square" /> Open Resend Dashboard
          </a>
        </div>
      </div>
    </section>
  );
}
