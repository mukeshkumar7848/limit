import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    // Initialize clients inside the function
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get the request body
    const body = await request.text();
    
    // Get Razorpay signature from headers
    const razorpaySignature = request.headers.get("x-razorpay-signature");
    
    if (!razorpaySignature) {
      return NextResponse.json(
        { error: "Missing Razorpay signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    // Verify signature
    if (expectedSignature !== razorpaySignature) {
      console.error("Invalid Razorpay signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;

    console.log("Razorpay Webhook Event:", event);

    // Handle different webhook events
    switch (event) {
      case "payment.captured":
        // Handle successful payment
        const paymentEntity = payload.payload.payment.entity;
        console.log("Payment captured:", paymentEntity);
        
        try {
          // Generate license key
          const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          
          // Calculate expiry date (1 year from now, adjust as needed)
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          // Save license to Supabase
          const { data: licenseData, error: licenseError } = await supabase
            .from("licenses")
            .insert({
              license_key: licenseKey,
              email: paymentEntity.email || null,
              phone: paymentEntity.contact || null,
              razorpay_payment_id: paymentEntity.id,
              razorpay_order_id: paymentEntity.order_id,
              amount: paymentEntity.amount / 100, // Convert paise to rupees
              currency: paymentEntity.currency,
              status: "active",
              device_id: null, // Will be set when user activates
              activations: 0,
              max_activations: 1, // Adjust based on your license type
              created_at: new Date().toISOString(),
              activated_at: null,
              expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

          if (licenseError) {
            console.error("License creation error:", licenseError);
          } else {
            console.log("License created:", licenseData);
          }

          // Save payment to Supabase
          const { data: paymentData, error: dbError } = await supabase
            .from("payments")
            .insert({
              payment_id: paymentEntity.id,
              order_id: paymentEntity.order_id,
              amount: paymentEntity.amount / 100, // Convert paise to rupees
              currency: paymentEntity.currency,
              status: paymentEntity.status,
              method: paymentEntity.method,
              email: paymentEntity.email,
              contact: paymentEntity.contact,
              created_at: new Date(paymentEntity.created_at * 1000).toISOString(),
              event_type: "payment.captured",
              raw_data: paymentEntity,
            });

          if (dbError) {
            console.error("Database error:", dbError);
          } else {
            console.log("Payment saved to database:", paymentData);
          }

          // Send success email with license key
          if (paymentEntity.email && licenseData && resend) {
            const { data: emailData, error: emailError } = await resend.emails.send({
              from: process.env.FROM_EMAIL || "onboarding@resend.dev",
              to: paymentEntity.email,
              subject: "Payment Successful! 🎉 Your License Key",
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
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${paymentEntity.id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${paymentEntity.currency.toUpperCase()} ${(paymentEntity.amount / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${paymentEntity.status}</td>
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
                      <li>Enter your license key when prompted</li>
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
              console.error("Email error:", emailError);
            } else {
              console.log("Email sent:", emailData);
            }
          }
        } catch (error) {
          console.error("Error processing payment.captured:", error);
        }
        break;

      case "payment.failed":
        // Handle failed payment
        const failedPayment = payload.payload.payment.entity;
        console.log("Payment failed:", failedPayment);
        
        try {
          // Save to Supabase
          const { data: failedData, error: dbError } = await supabase
            .from("payments")
            .insert({
              payment_id: failedPayment.id,
              order_id: failedPayment.order_id,
              amount: failedPayment.amount / 100,
              currency: failedPayment.currency,
              status: "failed",
              method: failedPayment.method,
              email: failedPayment.email,
              contact: failedPayment.contact,
              error_code: failedPayment.error_code,
              error_description: failedPayment.error_description,
              created_at: new Date(failedPayment.created_at * 1000).toISOString(),
              event_type: "payment.failed",
              raw_data: failedPayment,
            });

          if (dbError) {
            console.error("Database error:", dbError);
          }

          // Send failure notification email
          if (failedPayment.email && resend) {
            await resend.emails.send({
              from: process.env.FROM_EMAIL || "onboarding@resend.dev",
              to: failedPayment.email,
              subject: "Payment Failed",
              html: `
                <h2>Payment Failed</h2>
                <p>Unfortunately, your payment could not be processed.</p>
                <p><strong>Payment ID:</strong> ${failedPayment.id}</p>
                <p><strong>Amount:</strong> ${failedPayment.currency.toUpperCase()} ${(failedPayment.amount / 100).toFixed(2)}</p>
                <p><strong>Reason:</strong> ${failedPayment.error_description || "Payment failed"}</p>
                <p>Please try again or contact support if the issue persists.</p>
              `,
            });
          }
        } catch (error) {
          console.error("Error processing payment.failed:", error);
        }
        break;

      case "order.paid":
        // Handle paid order
        const orderEntity = payload.payload.order.entity;
        console.log("Order paid:", orderEntity);
        
        try {
          // Save to Supabase
          await supabase.from("orders").insert({
            order_id: orderEntity.id,
            amount: orderEntity.amount / 100,
            currency: orderEntity.currency,
            status: orderEntity.status,
            receipt: orderEntity.receipt,
            created_at: new Date(orderEntity.created_at * 1000).toISOString(),
            event_type: "order.paid",
            raw_data: orderEntity,
          });
        } catch (error) {
          console.error("Error processing order.paid:", error);
        }
        break;

      case "refund.created":
        // Handle refund
        const refundEntity = payload.payload.refund.entity;
        console.log("Refund created:", refundEntity);
        
        try {
          // Save to Supabase
          await supabase.from("refunds").insert({
            refund_id: refundEntity.id,
            payment_id: refundEntity.payment_id,
            amount: refundEntity.amount / 100,
            currency: refundEntity.currency,
            status: refundEntity.status,
            created_at: new Date(refundEntity.created_at * 1000).toISOString(),
            event_type: "refund.created",
            raw_data: refundEntity,
          });

          // Send refund notification email (if you have customer email)
          // You may need to fetch customer email from your database
        } catch (error) {
          console.error("Error processing refund.created:", error);
        }
        break;

      case "subscription.charged":
        // Handle subscription payment
        const subscriptionEntity = payload.payload.subscription.entity;
        console.log("Subscription charged:", subscriptionEntity);
        
        try {
          // Save to Supabase
          await supabase.from("subscriptions").insert({
            subscription_id: subscriptionEntity.id,
            plan_id: subscriptionEntity.plan_id,
            customer_id: subscriptionEntity.customer_id,
            status: subscriptionEntity.status,
            current_start: new Date(subscriptionEntity.current_start * 1000).toISOString(),
            current_end: new Date(subscriptionEntity.current_end * 1000).toISOString(),
            created_at: new Date(subscriptionEntity.created_at * 1000).toISOString(),
            event_type: "subscription.charged",
            raw_data: subscriptionEntity,
          });
        } catch (error) {
          console.error("Error processing subscription.charged:", error);
        }
        break;

      case "subscription.cancelled":
        // Handle subscription cancellation
        const cancelledSubscription = payload.payload.subscription.entity;
        console.log("Subscription cancelled:", cancelledSubscription);
        
        try {
          // Update subscription status in Supabase
          await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
            })
            .eq("subscription_id", cancelledSubscription.id);
        } catch (error) {
          console.error("Error processing subscription.cancelled:", error);
        }
        break;

      default:
        console.log("Unhandled event:", event);
    }

    // Return success response
    return NextResponse.json(
      { status: "success", event },
      { status: 200 }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. This endpoint only accepts POST requests." },
    { status: 405 }
  );
}
