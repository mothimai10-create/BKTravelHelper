// Email notification service
// Configure with your email service (SendGrid, Mailgun, etc.)

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Placeholder for email service integration
    // TODO: Integrate with SendGrid, Mailgun, or other email service
    
    console.log(`[EMAIL] To: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] HTML: ${options.html.substring(0, 100)}...`);

    // Example with SendGrid (uncomment if using):
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: options.to,
    //   from: process.env.FROM_EMAIL || 'noreply@bktravel.com',
    //   subject: options.subject,
    //   html: options.html,
    // });

    return true;
  } catch (error: any) {
    console.error('Email send error:', error);
    return false;
  }
}

export function createTripInviteEmail(
  userName: string,
  tripName: string,
  tripUrl: string,
  joinCode: string
): string {
  return `
    <h2>You've been invited to join a trip!</h2>
    <p>Hi ${userName},</p>
    <p>You've been invited to join the trip <strong>${tripName}</strong>.</p>
    <p>
      <a href="${tripUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Trip
      </a>
    </p>
    <p>Or use join code: <strong>${joinCode}</strong></p>
  `;
}

export function createTripStartEmail(tripName: string, startTime: string): string {
  return `
    <h2>Your trip is starting!</h2>
    <p>The trip <strong>${tripName}</strong> is now starting.</p>
    <p>Start time: ${startTime}</p>
    <p>Have a great trip!</p>
  `;
}

export function createBudgetAlertEmail(tripName: string, remaining: number): string {
  return `
    <h2>Budget Alert</h2>
    <p>The trip <strong>${tripName}</strong> has exceeded its budget!</p>
    <p>Remaining budget: -₹${Math.abs(remaining)}</p>
  `;
}