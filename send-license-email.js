// Quick script to send license email for the existing license
const { Resend } = require('resend');

const resend = new Resend('re_2aHMAW4U_GCwq9wuye6Tss8QPoxEgkENL');

const licenseKey = 'LIC-1770673217282-T1BDVMI0';
const email = 'choudharm187@gmail.com'; // Resend test mode - must use account owner email
const expiresAt = new Date('2027-02-09T21:40:17.282Z');

async function sendEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your License Key - Payment Successful! 🎉',
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
          
          <h3>License Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>License Key:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${licenseKey}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount Paid:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">INR 999.00</td>
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

    if (error) {
      console.error('❌ Email error:', error);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', data.id);
      console.log('📬 Sent to:', email);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendEmail();
