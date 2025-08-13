
import Stripe from 'stripe';

// This function is designed to be deployed as a serverless function.
// It creates a secure backend endpoint at `/api/create-payment-intent`.
// It expects a POST request.

// Initialize Stripe with the secret key from environment variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

// The public URL of your application, used for redirection after payment.
const siteUrl = process.env.PUBLIC_SITE_URL;

export default async function handler(req: Request): Promise<Response> {
    // 1. Check for POST method and ensure API keys are configured on the server
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
        });
    }

    if (!process.env.STRIPE_SECRET_KEY || !siteUrl) {
        console.error('Stripe secret key or site URL is not configured on the server.');
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 2. Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Tha Booth - Premium Access',
                            description: 'Unlock all creative effects and cloud saving features.',
                        },
                        unit_amount: 500, // $5.00 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${siteUrl}?payment_success=true`,
            cancel_url: `${siteUrl}?payment_cancel=true`,
        });

        // 3. Return the session ID to the frontend
        return new Response(JSON.stringify({ sessionId: session.id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error creating Stripe session:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// Vercel config to run this as an edge function for performance
export const config = {
  runtime: 'edge',
};
