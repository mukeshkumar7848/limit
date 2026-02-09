import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
        // Add your logic here (e.g., update database, send confirmation email)
        break;

      case "payment.failed":
        // Handle failed payment
        const failedPayment = payload.payload.payment.entity;
        console.log("Payment failed:", failedPayment);
        // Add your logic here
        break;

      case "order.paid":
        // Handle paid order
        const orderEntity = payload.payload.order.entity;
        console.log("Order paid:", orderEntity);
        // Add your logic here
        break;

      case "refund.created":
        // Handle refund
        const refundEntity = payload.payload.refund.entity;
        console.log("Refund created:", refundEntity);
        // Add your logic here
        break;

      case "subscription.charged":
        // Handle subscription payment
        const subscriptionEntity = payload.payload.subscription.entity;
        console.log("Subscription charged:", subscriptionEntity);
        // Add your logic here
        break;

      case "subscription.cancelled":
        // Handle subscription cancellation
        const cancelledSubscription = payload.payload.subscription.entity;
        console.log("Subscription cancelled:", cancelledSubscription);
        // Add your logic here
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
