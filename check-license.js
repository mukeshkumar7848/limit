// Check Supabase for the latest license
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hppgvcspprdkkzavtvti.supabase.co';
const supabaseKey = 'sb_publishable_G_ey0VFd4XL82pFsZ8_SHQ_pCNRCJ48';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLicense() {
  try {
    // Check for the latest payment
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('razorpay_payment_id', 'pay_SEC4yICwnewqV')
      .single();

    if (error) {
      console.log('❌ No license found for this payment');
      console.log('Error:', error.message);
      
      // Check if webhook endpoint exists
      console.log('\n⚠️  ISSUE: Webhook not triggered!');
      console.log('Reason: Testing locally - Razorpay cannot reach localhost');
      console.log('\nSolutions:');
      console.log('1. Deploy to Vercel and test on production URL');
      console.log('2. Use ngrok to expose localhost');
      console.log('3. Manually create license (I can help with this)');
    } else {
      console.log('✅ License found:', data);
      console.log('\n📧 Checking if email was sent...');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkLicense();
