export default function HomePage() {
  return (
    <main className="page">
      <div className="container">
        <div className="header">
          <div>
            <h1 className="title">LelaModa Ops</h1>
            <p className="subtitle">Starter project for Shopify order intake into your COD platform.</p>
          </div>
          <a className="btn" href="/orders">Open Orders</a>
        </div>

        <div className="notice">
          First milestone: Shopify order webhook → save customer → save order → save items → show orders here.
        </div>

        <div className="grid kpi-grid">
          <div className="card">
            <div>Webhook endpoint</div>
            <div className="kpi-value">/api/webhooks/shopify/orders-create</div>
          </div>
          <div className="card">
            <div>Default business status</div>
            <div className="kpi-value">pending_confirmation</div>
          </div>
          <div className="card">
            <div>Default payment status</div>
            <div className="kpi-value">pending</div>
          </div>
        </div>
      </div>
    </main>
  );
}
