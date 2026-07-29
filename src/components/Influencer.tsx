"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  Download,
  Gift,
  LogOut,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Wallet
} from "lucide-react";
import { useStepwise } from "@/lib/store";
import { demoMarketingAssets } from "@/lib/data";
import type { InfluencerProfile, MarketingAsset, PayoutRecord, ReferralConversion } from "@/lib/types";
import { Avatar, Badge, Modal, StatCard, Toast } from "./ui";

type StepwiseDispatch = ReturnType<typeof useStepwise>["dispatch"];
type PayoutMethod = InfluencerProfile["payoutMethod"];

function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function InfluencerLoginPage() {
  return (
    <div className="influencer-login-container">
      <div className="influencer-login-card">
        <div className="login-brand-head">
          <div className="partner-logo-icon">
            <ShieldCheck size={24} />
          </div>
          <h2>Partner access is protected by Appwrite</h2>
          <p>This account does not yet have a provisioned partner profile.</p>
        </div>
        <div className="login-help-card">
          <ShieldCheck size={15} />
          <div>
            <b>No secondary or shared passwords</b>
            <p>Partner access requires a verified Stepwise account, an Appwrite influencer label, and a server-side partner profile.</p>
          </div>
        </div>
        <Link className="btn btn-brand btn-block margin-top-20" href="/login?returnTo=%2Finfluencer">
          Sign in with Stepwise <ArrowRight size={16} />
        </Link>
        <a className="btn btn-secondary btn-block margin-top-14" href="mailto:support@stepwise.page?subject=Partner%20profile%20provisioning">
          Request partner provisioning
        </a>
      </div>
    </div>
  );
}

function InfluencerHeaderBanner({ influencer, onLogout }: {
  influencer: InfluencerProfile;
  onLogout: () => void;
}) {
  return (
    <div className="influencer-hero-banner">
      <div className="hero-profile-info">
        <Avatar name={influencer.name} size="lg" />
        <div>
          <div className="hero-profile-meta">
            <h2>{influencer.name}</h2>
            <Badge tone="brand">{influencer.tier}</Badge>
            <span className="influencer-handle">{influencer.handle}</span>
          </div>
          <p className="hero-subtext">
            Partner since {influencer.joinedDate} · <b>{Math.round(influencer.commissionRate * 100)}% Revenue-Share</b> on Net Profit
          </p>
        </div>
      </div>
      <div className="hero-account-actions">
        <button className="btn btn-secondary btn-sm" onClick={onLogout}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}

function NetProfitFormulaCard({ commissionRate }: { commissionRate: number }) {
  const commissionPercent = Math.round(commissionRate * 100);
  const examplePayout = 150 * commissionRate;

  return (
    <div className="net-profit-formula-card">
      <div className="formula-icon">
        <Sparkles size={20} />
      </div>
      <div className="formula-content">
        <div className="formula-head">
          <h4>Transparent Net Profit Revenue-Share Model</h4>
          <span className="formula-badge">{commissionPercent}% partner share</span>
        </div>
        <p className="formula-math">
          <b>Net Profit Base</b> = List Price - 10% Operational Cost - Coupon Discount
        </p>
        <p className="formula-sub">
          Example: $200 subscription - 15% student code ($30) - 10% operations ($20) = <b>$150 net profit base</b> → <b>${examplePayout.toFixed(2)} partner share</b>
        </p>
      </div>
    </div>
  );
}

function InfluencerOverview({ influencer, conversions, payouts }: {
  influencer: InfluencerProfile;
  conversions: ReferralConversion[];
  payouts: PayoutRecord[];
}) {
  const [toast, setToast] = useState("");
  const infConversions = conversions.filter((c) => c.influencerId === influencer.id);
  const totalGrossSales = infConversions.reduce((sum, c) => sum + c.listPrice, 0);
  const totalNetProfit = infConversions.reduce((sum, c) => sum + c.netProfit, 0);
  const totalEarnings = infConversions.reduce((sum, c) => sum + c.commissionEarned, 0);
  const approvedEarnings = infConversions.filter((c) => c.status === "Approved").reduce((sum, c) => sum + c.commissionEarned, 0);
  const awaitingApproval = infConversions.filter((c) => c.status === "Pending").reduce((sum, c) => sum + c.commissionEarned, 0);
  const processingPayouts = payouts
    .filter((p) => p.influencerId === influencer.id && p.status === "Processing")
    .reduce((sum, p) => sum + p.amount, 0);
  const availableEarnings = Math.max(0, approvedEarnings - processingPayouts);
  const conversionRate = influencer.totalClicks > 0 ? ((infConversions.length / influencer.totalClicks) * 100).toFixed(1) : "0.0";

  const copyReferralLink = () => {
    navigator.clipboard?.writeText(influencer.referralUrl);
    setToast("Referral link copied to clipboard!");
    setTimeout(() => setToast(""), 1800);
  };

  const copyPromoCode = () => {
    navigator.clipboard?.writeText(influencer.defaultPromoCode);
    setToast(`Promo code ${influencer.defaultPromoCode} copied!`);
    setTimeout(() => setToast(""), 1800);
  };

  return (
    <>
      <PageHeader
        title="Influencer Dashboard"
        description="Track your referral revenue, net profit share, link performance, and upcoming payouts."
        actions={
          <button className="btn btn-brand" onClick={copyReferralLink}>
            <Share2 size={16} /> Copy Referral Link
          </button>
        }
      />

      <NetProfitFormulaCard commissionRate={influencer.commissionRate} />

      <section className="stat-grid four">
        <StatCard
          label="Total Gross Sales"
          value={`$${totalGrossSales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={infConversions.length > 0 ? "+18%" : "0%"}
          detail="Driven to Stepwise"
          icon={<CircleDollarSign />}
        />
        <StatCard
          label="Net Profit Base"
          value={`$${totalNetProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          detail="After 10% ops & coupons"
          icon={<TrendingUp />}
        />
        <StatCard
          label={`Your Earnings (${Math.round(influencer.commissionRate * 100)}%)`}
          value={`$${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="Lifetime"
          detail="Accumulated share"
          icon={<Wallet />}
        />
        <StatCard
          label="Available Payout"
          value={`$${availableEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          detail={`$${awaitingApproval.toFixed(2)} awaiting approval`}
          icon={<Gift />}
        />
      </section>

      <div className="influencer-quick-share-strip">
        <div className="quick-share-box">
          <label htmlFor="default-partner-link">Your Default Partner Link:</label>
          <div className="copy-input-group">
            <input id="default-partner-link" readOnly value={influencer.referralUrl} />
            <button className="btn btn-secondary btn-sm" onClick={copyReferralLink}>
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>
        <div className="quick-share-box">
          <label htmlFor="default-partner-code">Your Follower Coupon Code ({influencer.defaultDiscountPercent}% Off):</label>
          <div className="copy-input-group">
            <input id="default-partner-code" readOnly value={influencer.defaultPromoCode} className="promo-code-input" />
            <button className="btn btn-secondary btn-sm" onClick={copyPromoCode}>
              <Copy size={14} /> Copy Code
            </button>
          </div>
        </div>
      </div>

      <section className="influencer-main-grid">
        <article className="panel influencer-conversion-preview">
          <header className="panel-head-between">
            <div>
              <h3>Recent Referral Conversions</h3>
              <p>Real-time log of paid subscriptions driven by your referral link & promo code.</p>
            </div>
            <Link href="/influencer/conversions" className="view-all-link">
              View all <ChevronRight size={16} />
            </Link>
          </header>
          <div className="responsive-table">
            <table>
              <caption className="sr-only">Five most recent subscriptions attributed to your partner account</caption>
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Plan</th>
                  <th scope="col">List Price</th>
                  <th scope="col">Coupon discount</th>
                  <th scope="col">Net Profit</th>
                  <th scope="col">Your Share ({Math.round(influencer.commissionRate * 100)}%)</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {infConversions.slice(0, 5).map((conv) => (
                  <tr key={conv.id}>
                    <td>
                      <div className="masked-user-cell">
                        <User size={14} /> <b>{conv.customerMaskedEmail}</b>
                      </div>
                    </td>
                    <td>{conv.planName}</td>
                    <td>${conv.listPrice.toFixed(2)}</td>
                    <td className="discount-tag-cell">-${conv.discountAmount.toFixed(2)}</td>
                    <td>
                      <b>${conv.netProfit.toFixed(2)}</b>
                    </td>
                    <td>
                      <b className="earnings-highlight">${conv.commissionEarned.toFixed(2)}</b>
                    </td>
                    <td>
                      <Badge tone={conv.status === "Paid" ? "success" : conv.status === "Approved" ? "brand" : "warning"}>
                        {conv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!infConversions.length && (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      No referred conversions logged yet. Share your partner link to start earning!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="panel influencer-sidebar-card">
          <h3>Traffic & Performance</h3>
          <div className="traffic-metric-row">
            <div>
              <span>Link Clicks</span>
              <b>{influencer.totalClicks.toLocaleString()}</b>
            </div>
            <div>
              <span>Signups</span>
              <b>{influencer.totalSignups.toLocaleString()}</b>
            </div>
            <div>
              <span>Conversion Rate</span>
              <b>{conversionRate}%</b>
            </div>
          </div>

          <hr className="divider-line" />

          <h3>Payout Account</h3>
          <div className="payout-account-preview">
            <CreditCard size={18} />
            <div>
              <b>{influencer.payoutMethod || "Not Set"}</b>
              <small>{influencer.payoutAccount || "Configure in settings"}</small>
            </div>
          </div>
          <Link href="/influencer/payouts" className="btn btn-secondary btn-block margin-top-12">
            Manage Payout Settings
          </Link>
        </aside>
      </section>

      <Toast message={toast} visible={Boolean(toast)} />
    </>
  );
}

function InfluencerLinks({ influencer }: { influencer: InfluencerProfile }) {
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmCampaign, setUtmCampaign] = useState("bio_link");
  const [toast, setToast] = useState("");

  const customUrl = `https://stepwise.page/?ref=${influencer.defaultPromoCode}&utm_source=${utmSource}&utm_campaign=${utmCampaign}`;

  const copyCustomUrl = () => {
    navigator.clipboard?.writeText(customUrl);
    setToast("Custom campaign link copied!");
    setTimeout(() => setToast(""), 1800);
  };

  return (
    <>
      <PageHeader
        title="Links & Promo Codes"
        description="Generate custom UTM tracking links and download QR codes for YouTube, Instagram, TikTok, and Telegram."
      />

      <div className="links-layout-grid">
        <article className="panel">
          <header>
            <h3>Campaign Link Generator</h3>
            <p>Add campaign tags to track traffic sources across your channels.</p>
          </header>
          <div className="link-builder-form">
            <div className="form-row-2">
              <div className="field">
                <label className="field-label" htmlFor="partner-utm-source">Traffic Source</label>
                <select id="partner-utm-source" value={utmSource} onChange={(e) => setUtmSource(e.target.value)}>
                  <option value="instagram">Instagram Bio / Story</option>
                  <option value="youtube">YouTube Video Description</option>
                  <option value="tiktok">TikTok Bio</option>
                  <option value="telegram">Telegram / WhatsApp Group</option>
                  <option value="blog">Personal Blog / Newsletter</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="partner-utm-campaign">Campaign Tag</label>
                <input id="partner-utm-campaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="e.g. step1_review_video" />
              </div>
            </div>

            <div className="field margin-top-16">
              <label className="field-label" htmlFor="generated-partner-link">Generated Campaign Link</label>
              <div className="copy-input-group">
                <input id="generated-partner-link" readOnly value={customUrl} />
                <button className="btn btn-brand" onClick={copyCustomUrl}>
                  <Copy size={16} /> Copy
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="panel qr-code-panel">
          <header>
            <h3>QR Code Generator</h3>
            <p>Ideal for lecture slides, Instagram stories, and printable flyers.</p>
          </header>
          <div className="qr-container">
            <div className="qr-box">
              <QrCode size={140} color="var(--brand)" />
              <span>{influencer.defaultPromoCode}</span>
            </div>
            <button className="btn btn-secondary btn-block margin-top-16" onClick={() => setToast("Vector SVG & High-Res PNG QR code downloaded")}>
              <Download size={16} /> Download QR Code Pack
            </button>
          </div>
        </article>
      </div>

      <Toast message={toast} visible={Boolean(toast)} />
    </>
  );
}

function InfluencerConversions({ influencer, conversions }: { influencer: InfluencerProfile; conversions: ReferralConversion[] }) {
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const infConversions = conversions.filter((c) => c.influencerId === influencer.id);

  const filtered = infConversions.filter((c) => {
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchSearch = c.planName.toLowerCase().includes(search.toLowerCase()) || c.customerMaskedEmail.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalCommission = filtered.reduce((s, c) => s + c.commissionEarned, 0);

  return (
    <>
      <PageHeader
        title="Referral Conversions Ledger"
        description="Detailed line-by-line financial audit of every customer subscription, discount, operational cost, net profit base, and 30% commission."
      />

      <section className="panel admin-table-panel">
        <header className="admin-filterbar">
          <div className="table-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by plan name or customer..."
              aria-label="Search referral conversions by plan or customer"
            />
          </div>
          <div className="filter-tab-group" role="group" aria-label="Filter conversions by status">
            {["All", "Approved", "Pending", "Paid"].map((st) => (
              <button
                key={st}
                className={`tab-btn ${filterStatus === st ? "active" : ""}`}
                onClick={() => setFilterStatus(st)}
                aria-pressed={filterStatus === st}
              >
                {st}
              </button>
            ))}
          </div>
        </header>

        <div className="responsive-table">
          <table>
            <caption className="sr-only">Referral conversion ledger with the current search and status filters applied</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Customer</th>
                <th scope="col">Plan Name</th>
                <th scope="col">List Price</th>
                <th scope="col">Student Discount</th>
                <th scope="col">Customer Paid</th>
                <th scope="col">10% Ops Cost</th>
                <th scope="col">Net Profit Base</th>
                <th scope="col">Your Share ({Math.round(influencer.commissionRate * 100)}%)</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td>
                    <div className="masked-user-cell">
                      <User size={13} /> {c.customerMaskedEmail}
                    </div>
                  </td>
                  <td><b>{c.planName}</b></td>
                  <td>${c.listPrice.toFixed(2)}</td>
                  <td className="discount-tag-cell">-${c.discountAmount.toFixed(2)} ({c.discountPercent}%)</td>
                  <td>${c.customerPaid.toFixed(2)}</td>
                  <td className="text-muted">-${c.operationalCost.toFixed(2)}</td>
                  <td><b>${c.netProfit.toFixed(2)}</b></td>
                  <td>
                    <b className="earnings-highlight">${c.commissionEarned.toFixed(2)}</b>
                  </td>
                  <td>
                    <Badge tone={c.status === "Paid" ? "success" : c.status === "Approved" ? "brand" : "warning"}>
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="table-empty">
                    No conversion records matching your current filter.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={8} className="text-right">
                    <b>Total Commission in view:</b>
                  </td>
                  <td colSpan={2}>
                    <b className="earnings-highlight font-16">${totalCommission.toFixed(2)}</b>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </>
  );
}

function InfluencerPayouts({ influencer, payouts, conversions, dispatch }: {
  influencer: InfluencerProfile;
  payouts: PayoutRecord[];
  conversions: ReferralConversion[];
  dispatch: StepwiseDispatch;
}) {
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [method, setMethod] = useState<PayoutMethod>(influencer.payoutMethod || "PayPal");
  const [account, setAccount] = useState<string>(influencer.payoutAccount || "");
  const [toast, setToast] = useState("");

  const infPayouts = payouts.filter((p) => p.influencerId === influencer.id);
  const approvedEarnings = conversions
    .filter((conversion) => conversion.influencerId === influencer.id && conversion.status === "Approved")
    .reduce((sum, conversion) => sum + conversion.commissionEarned, 0);
  const processingAmount = infPayouts
    .filter((payout) => payout.status === "Processing")
    .reduce((sum, payout) => sum + payout.amount, 0);
  const availableBalance = Math.max(0, approvedEarnings - processingAmount);
  const payoutEligible = availableBalance >= 50 && Boolean(account.trim());

  const savePayoutMethod = () => {
    if (!account.trim()) {
      setToast("Enter a payout account before saving.");
      setTimeout(() => setToast(""), 1800);
      return;
    }
    dispatch({ type: "UPDATE_INFLUENCER_PAYOUT_METHOD", influencerId: influencer.id, method, account: account.trim() });
    setToast("Payout account updated");
    setTimeout(() => setToast(""), 1800);
  };

  const handleRequestPayout = () => {
    if (!payoutEligible) return;
    dispatch({ type: "UPDATE_INFLUENCER_PAYOUT_METHOD", influencerId: influencer.id, method, account: account.trim() });
    dispatch({ type: "REQUEST_PAYOUT", influencerId: influencer.id, amount: availableBalance, method, account: account.trim() });
    setPayoutModalOpen(false);
    setToast(`$${availableBalance.toFixed(2)} payout request submitted for review`);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <>
      <PageHeader
        title="Payout Management"
        description="Manage your payout withdrawal accounts, view payout logs, and trigger payout requests."
      />

      <div className="payouts-top-grid">
        <article className="panel payout-balance-card">
          <div className="balance-head">
            <Wallet size={24} />
            <span>Available Balance</span>
          </div>
          <h2 className="balance-amount">${availableBalance.toFixed(2)}</h2>
          <p className="balance-sub">
            Approved earnings minus processing payouts. Minimum request: $50.00.
          </p>
          <button className="btn btn-brand btn-block margin-top-16" onClick={() => setPayoutModalOpen(true)} disabled={!payoutEligible}>
            Request Payout Review
          </button>
        </article>

        <article className="panel payout-settings-card">
          <h3>Payout Account Settings</h3>
          <div className="field margin-top-12">
            <label className="field-label" htmlFor="partner-payout-method">Payment Method</label>
            <select id="partner-payout-method" value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)}>
              <option value="PayPal">PayPal</option>
              <option value="Stripe">Stripe Connect</option>
              <option value="Bank Wire">Direct Bank Wire / ACH</option>
            </select>
          </div>
          <div className="field margin-top-12">
            <label className="field-label" htmlFor="partner-payout-account">{method === "PayPal" ? "PayPal Email" : method === "Stripe" ? "Stripe Account ID" : "Bank IBAN / Routing & Account"}</label>
            <input id="partner-payout-account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. sarah.lin@medinfluencers.io" />
          </div>
          <button className="btn btn-secondary margin-top-16" onClick={savePayoutMethod}>
            Save Payout Account
          </button>
        </article>
      </div>

      <section className="panel admin-table-panel margin-top-24">
        <header className="panel-head-between">
          <h3>Payout Transfer History</h3>
        </header>
        <div className="responsive-table">
          <table>
            <caption className="sr-only">Your payout request and transfer history</caption>
            <thead>
              <tr>
                <th scope="col">Request Date</th>
                <th scope="col">Reference #</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Account</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {infPayouts.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td><code>{p.referenceNumber}</code></td>
                  <td><b>${p.amount.toFixed(2)}</b></td>
                  <td>{p.method}</td>
                  <td>{p.account}</td>
                  <td>
                    <Badge tone={p.status === "Completed" ? "success" : p.status === "Processing" ? "warning" : "danger"}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!infPayouts.length && (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No past payout transfers recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={payoutModalOpen} onClose={() => setPayoutModalOpen(false)} title="Confirm Payout Request">
        <div className="payout-modal-body">
          <p>You are requesting a payout for your available balance:</p>
          <div className="modal-amount-display">${availableBalance.toFixed(2)}</div>
          <p>
            After administrator approval, funds will be transferred via <b>{method}</b> to <b>{account.trim()}</b>. The request will remain marked Processing until reviewed.
          </p>
          <div className="modal-actions-between margin-top-20">
            <button className="btn btn-secondary" onClick={() => setPayoutModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-brand" onClick={handleRequestPayout}>
              Confirm & Submit Payout Request
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast} visible={Boolean(toast)} />
    </>
  );
}

function InfluencerMedia({ assets }: { assets: MarketingAsset[] }) {
  const [toast, setToast] = useState("");

  const handleDownload = (asset: MarketingAsset) => {
    setToast(`Downloaded ${asset.title}`);
    setTimeout(() => setToast(""), 1800);
  };

  const handleCopyText = (text?: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setToast("Promo copy template copied to clipboard!");
    setTimeout(() => setToast(""), 1800);
  };

  return (
    <>
      <PageHeader
        title="Marketing Assets & Media Kit"
        description="Download official Stepwise banners, Instagram story templates, logos, and pre-written promo scripts."
      />

      <div className="media-assets-grid">
        {assets.map((ast) => (
          <article key={ast.id} className="panel asset-card">
            <div className="asset-category-badge">
              <Badge tone="brand">{ast.category}</Badge>
              {ast.dimensions && <span className="dim-tag">{ast.dimensions}</span>}
            </div>
            <h3>{ast.title}</h3>
            {ast.previewText && <p className="asset-preview-text">{ast.previewText}</p>}
            <div className="asset-actions">
              {ast.category === "Copy Template" ? (
                <button className="btn btn-secondary btn-sm btn-block" onClick={() => handleCopyText(ast.previewText)}>
                  <Copy size={14} /> Copy Text Script
                </button>
              ) : (
                <button className="btn btn-secondary btn-sm btn-block" onClick={() => handleDownload(ast)}>
                  <Download size={14} /> Download Asset
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <Toast message={toast} visible={Boolean(toast)} />
    </>
  );
}

export function InfluencerPage({ slug = [] }: { slug?: string[] }) {
  const { state, dispatch } = useStepwise();
  const currentInfluencer = state.influencers.find((i) => i.id === state.currentInfluencerId);
  const subroute = slug[1] || "";

  const handleLogout = () => {
    dispatch({ type: "LOGOUT_INFLUENCER" });
  };

  if (!currentInfluencer) {
    return <InfluencerLoginPage />;
  }

  return (
    <div className="influencer-portal-wrapper">
      <InfluencerHeaderBanner
        influencer={currentInfluencer}
        onLogout={handleLogout}
      />

      {subroute === "" && (
        <InfluencerOverview
          influencer={currentInfluencer}
          conversions={state.referralConversions}
          payouts={state.payoutRecords}
        />
      )}
      {subroute === "links" && <InfluencerLinks influencer={currentInfluencer} />}
      {subroute === "conversions" && (
        <InfluencerConversions influencer={currentInfluencer} conversions={state.referralConversions} />
      )}
      {subroute === "payouts" && (
        <InfluencerPayouts
          influencer={currentInfluencer}
          payouts={state.payoutRecords}
          conversions={state.referralConversions}
          dispatch={dispatch}
        />
      )}
      {subroute === "media" && <InfluencerMedia assets={demoMarketingAssets} />}
    </div>
  );
}
