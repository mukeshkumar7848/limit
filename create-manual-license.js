// Manually create license for the payment
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabaseUrl = 'https://hppgvcspprdkkzavtvti.supabase.co';
const supabaseKey = 'sb_publishable_G_ey0VFd4XL82pFsZ8_SHQ_pCNRCJ48';
const resend = new Resend('re_2aHMAW4U_GCwq9wuye6Tss8QPoxEgkENL');

const supabase = createClient(supabaseUrl, supabaseKey);

async function createLicense() {
  try {
    // Payment details from screenshot
    const paymentId = 'pay_SEC4yICwnewqV';
    const orderId = 'order_SECbz4KLOKpCDA';
    const email = 'choudharm187@gmail.com';
    const phone = '7558499267';
    const amount = 999;
    
    // Generate license key
    const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // Calculate expiry (1 year)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    console.log('🔑 Creating license:', licenseKey);
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        email: email,
        phone: `+91${phone}`,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        amount: amount,
        currency: 'INR',
        status: 'active',
        device_id: null,
        activations: 0,
        max_activations: 1,
        created_at: new Date().toISOString(),
        activated_at: null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('✅ License created in database:', data);
    
    // Send email
    console.log('\n📧 Sending email to:', email);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'license@notifications.mukeshfx.com',
      to: email,
      subject: 'Payment Successful! 🎉 Your License Key',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Payment Confirmation</h2>
          <p>Thank you for your payment!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your License Key:</h3>
            <p style="font-size: 18px; font-weight: bold; color: #333; background: white; padding: 15px; border-radius: 4px; font-family: monospace;">
              ${licenseKey}
            </p>
            <p style="font-size: 12px; color: #666;">Please save this license key. You'll need it to activate your product.</p>
          </div>
          
          <h3>Payment Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Payment ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Order ID:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">INR ${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Active</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Expires:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${expiresAt.toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Max Activations:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">1 device</td>
            </tr>
          </table>
          
          <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #1976d2;">How to Activate:</h4>
            <ol style="line-height: 1.8;">
              <li>Open the application</li>
              <li>Enter your license key: <strong>${licenseKey}</strong></li>
              <li>Click "Activate"</li>
              <li>Start using your product!</li>
            </ol>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
      `,
    });
    
    if (emailError) {
      console.error('❌ Email error:', emailError);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', emailData.id);
    }
    
    console.log('\n🎉 DONE! License created and email sent!');
    console.log('License Key:', licenseKey);
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createLicense();
