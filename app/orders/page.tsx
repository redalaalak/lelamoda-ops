import { supabaseAdmin } from '@/lib/supabase/admin';

async function getOrders() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, shopify_order_name, shopify_order_number, customer_full_name, customer_phone, shipping_city, total_price, business_status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: data || [], error: null };
}

export default async function OrdersPage() {
  const { rows, error } = await getOrders();

  return (
    <main className="page">
      <div className="container">
        <div className="header">
          <div>
            <h1 className="title">Orders</h1>
            <p className="subtitle">Latest Shopify orders saved into LelaModa Ops.</p>
          </div>
          <a href="/" className="btn secondary">Back home</a>
        </div>

        {error ? <div className="notice">Supabase error: {error}</div> : null}

        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>No orders yet. Once Shopify sends a webhook, rows will appear here.</td>
                </tr>
              ) : (
                rows.map((order: any) => (
                  <tr key={order.id}>
                    <td>{order.shopify_order_name || order.shopify_order_number || order.id}</td>
                    <td>{order.customer_full_name || '-'}</td>
                    <td>{order.customer_phone || '-'}</td>
                    <td>{order.shipping_city || '-'}</td>
                    <td><span className="badge pending">{order.business_status}</span></td>
                    <td>{order.payment_status}</td>
                    <td>{order.total_price}</td>
                    <td>{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
