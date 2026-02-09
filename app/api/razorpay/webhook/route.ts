import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
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

          // Generate and create license
          const crypto = await import("crypto");
          const licenseKey = `LIC-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
          
          // Determine license duration based on amount or order notes
          // You can customize this logic based on your pricing
          const amount = paymentEntity.amount / 100;
          let maxActivations = 1;
          let daysValid = 30; // default 30 days
          
          // Example pricing logic (customize as needed)
          if (amount >= 999) {
            maxActivations = 5;
            daysValid = 365; // 1 year
          } else if (amount >= 499) {
            maxActivations = 3;
            daysValid = 180; // 6 months
          } else if (amount >= 199) {
            maxActivations = 1;
            daysValid = 90; // 3 months
          }

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + daysValid);

          // Create license in database
          const { data: licenseData, error: licenseError } = await supabase
            .from("licenses")
            .insert({
              license_key: licenseKey,
              email: paymentEntity.email,
              phone: paymentEntity.contact,
              razorpay_payment_id: paymentEntity.id,
              razorpay_order_id: paymentEntity.order_id,
              amount: paymentEntity.amount,
              currency: paymentEntity.currency,
              status: "active",
              activations: 0,
              max_activations: maxActivations,
              created_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

          if (licenseError) {
            console.error("License creation error:", licenseError);
          } else {
            console.log("License created:", licenseData);
          }

          // Send success email with license key
          if (paymentEntity.email) {
            const { data: emailData, error: emailError } = await resend.emails.send({
              from: process.env.FROM_EMAIL || "onboarding@resend.dev",
              to: paymentEntity.email,
              subject: "Payment Successful! 🎉 Your License Key",
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .license-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
                    .license-key { font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 2px; word-break: break-all; }
                    .details { background: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 Payment Successful!</h1>
                      <p>Thank you for your purchase</p>
                    </div>
                    <div class="content">
                      <h2>Your License Key</h2>
                      <div class="license-box">
                        <p style="margin: 0 0 10px 0;">License Key:</p>
                        <div class="license-key">${licenseKey}</div>
                      </div>
                      
                      <div class="details">
                        <h3>Payment Details</h3>
                        <p><strong>Payment ID:</strong> ${paymentEntity.id}</p>
                        <p><strong>Amount:</strong> ${paymentEntity.currency.toUpperCase()} ${(paymentEntity.amount / 100).toFixed(2)}</p>
                        <p><strong>Status:</strong> ${paymentEntity.status}</p>
                        <p><strong>Method:</strong> ${paymentEntity.method}</p>
                      </div>

                      <div class="details">
                        <h3>License Information</h3>
                        <p><strong>Max Activations:</strong> ${maxActivations} device(s)</p>
                        <p><strong>Valid Until:</strong> ${expiresAt.toLocaleDateString()}</p>
                        <p><strong>Current Activations:</strong> 0</p>
                      </div>

                      <p><strong>Important:</strong> Keep this license key safe. You'll need it to activate your software.</p>
                      
                      <div style="text-align: center;">
                        <a href="#" class="button">Activate License</a>
                      </div>

                      <div class="footer">
                        <p>If you have any questions, please contact our support team.</p>
                        <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `,
            });

            if (emailError) {
              console.error("Email error:", emailError);
            } else {
              console.log("Email sent with license key:", emailData);
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
          if (failedPayment.email) {
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
