const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587,
      auth: { user: 'ethereal_test@ethereal.email', pass: 'ethereal_pass' }
    });
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
};

// ── Delivery OTP email (sent by agent at doorstep) ──
const sendOTPEmail = async (email, otp, orderId, customerName) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"DeliverVerify" <${process.env.EMAIL_USER || 'noreply@deliververify.com'}>`,
      to: email,
      subject: '🔐 Your Delivery OTP — DeliverVerify',
      html: `<!DOCTYPE html><html><body style="font-family:'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:20px;">
        <div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px;text-align:center;">
            <h1 style="color:#e94560;margin:0;font-size:28px;letter-spacing:2px;">DELIVERVERIFY</h1>
            <p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">Secure Delivery Confirmation</p>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="color:#4a5568;font-size:16px;margin-bottom:8px;">Hello <strong>${customerName}</strong>,</p>
            <p style="color:#4a5568;font-size:15px;">Your delivery agent has arrived. Please share this OTP to confirm delivery.</p>
            <div style="background:#f7fafc;border:2px dashed #e94560;border-radius:12px;padding:24px;margin:24px 0;">
              <p style="color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">One-Time Password</p>
              <h2 style="color:#1a1a2e;font-size:48px;letter-spacing:12px;margin:0;font-weight:900;">${otp}</h2>
            </div>
            <div style="background:#fff5f5;border-left:4px solid #e94560;padding:12px 16px;border-radius:4px;text-align:left;margin-bottom:16px;">
              <p style="color:#c53030;font-size:13px;margin:0;"><strong>⚠️ Expires in 5 minutes.</strong> Only share with your delivery agent.</p>
            </div>
            <p style="color:#a0aec0;font-size:12px;margin:0;">Order ID: <strong>#${orderId}</strong></p>
          </div>
          <div style="background:#f7fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#a0aec0;font-size:12px;margin:0;">© 2024 DeliverVerify. Secure delivery, guaranteed.</p>
          </div>
        </div></body></html>`
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Delivery OTP email sent:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl?.(info);
    if (previewUrl) console.log('📧 Preview:', previewUrl);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Order confirmation email (sent when customer places order) ──
const sendOrderConfirmationEmail = async (email, customerName, orderId, products, totalAmount, paymentMethod, upiTxnId) => {
  try {
    const transporter = createTransporter();
    const productRows = products.map(p =>
      `<tr>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#2d3748;">${p.name}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#718096;text-align:center;">×${p.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#e94560;text-align:right;font-weight:700;">₹${(p.price * p.quantity).toLocaleString('en-IN')}</td>
      </tr>`
    ).join('');

    const paymentBadge = paymentMethod === 'UPI'
      ? `<span style="background:#ebf8ff;color:#2b6cb0;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:600;">✅ UPI Paid</span>`
      : `<span style="background:#fff5f5;color:#c53030;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:600;">💵 Pay on Delivery</span>`;

    const mailOptions = {
      from: `"DeliverVerify" <${process.env.EMAIL_USER || 'noreply@deliververify.com'}>`,
      to: email,
      subject: `✅ Order Confirmed #${String(orderId).slice(-8).toUpperCase()} — DeliverVerify`,
      html: `<!DOCTYPE html><html><body style="font-family:'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:20px;">
        <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px;text-align:center;">
            <h1 style="color:#e94560;margin:0;font-size:28px;letter-spacing:2px;">DELIVERVERIFY</h1>
            <p style="color:#a0aec0;margin:8px 0 0;">Order Confirmed 🎉</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:16px;color:#2d3748;">Hey <strong>${customerName}</strong>! Your order is confirmed.</p>
            <div style="background:#f7fafc;border-radius:12px;padding:16px;margin:16px 0;">
              <p style="margin:0;font-size:13px;color:#718096;">ORDER ID</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#1a1a2e;letter-spacing:2px;">#${String(orderId).slice(-8).toUpperCase()}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <thead><tr style="background:#f7fafc;">
                <th style="padding:10px;text-align:left;font-size:12px;color:#718096;text-transform:uppercase;">Product</th>
                <th style="padding:10px;text-align:center;font-size:12px;color:#718096;text-transform:uppercase;">Qty</th>
                <th style="padding:10px;text-align:right;font-size:12px;color:#718096;text-transform:uppercase;">Amount</th>
              </tr></thead>
              <tbody>${productRows}</tbody>
            </table>
            <div style="background:#1a1a2e;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#a0aec0;font-size:15px;">Total Amount</span>
              <span style="color:#e94560;font-size:22px;font-weight:900;">₹${totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style="margin:16px 0;display:flex;align-items:center;gap:12px;">
              <span style="color:#4a5568;font-size:14px;">Payment:</span>
              ${paymentBadge}
              ${upiTxnId ? `<span style="color:#718096;font-size:12px;">Txn: ${upiTxnId}</span>` : ''}
            </div>
            <div style="background:#f0fff4;border:1px solid #9ae6b4;border-radius:12px;padding:16px;margin-top:20px;">
              <p style="color:#276749;font-size:14px;margin:0;font-weight:600;">🔐 OTP Delivery Verification</p>
              <p style="color:#48bb78;font-size:13px;margin:8px 0 0;">When your delivery agent arrives, you will receive a 6-digit OTP on this email. Share it with the agent to confirm delivery.</p>
            </div>
          </div>
          <div style="background:#f7fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#a0aec0;font-size:12px;margin:0;">Estimated delivery: 3 business days · © 2024 DeliverVerify</p>
          </div>
        </div></body></html>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Order confirmation email sent:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl?.(info);
    if (previewUrl) console.log('📧 Preview:', previewUrl);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Order confirmation email failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail, sendOrderConfirmationEmail };
