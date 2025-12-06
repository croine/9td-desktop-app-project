import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/components/emails/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true,
		requireEmailVerification: true,
		sendVerificationOnSignUp: true,
		async sendVerificationEmail({ user, url, token }) {
			try {
				const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
				const verificationUrl = `${appUrl}/verify-email?token=${token}`;
				
				const emailHtml = render(
					VerificationEmail({
						name: user.name || 'User',
						verificationUrl,
					})
				);

				await resend.emails.send({
					from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
					to: user.email,
					subject: '🎯 Verify your 9TD account',
					html: emailHtml,
					replyTo: process.env.RESEND_REPLY_TO,
				});

				console.log(`✅ Verification email sent to ${user.email}`);
			} catch (error) {
				console.error('❌ Failed to send verification email:', error);
				throw error;
			}
		},
	},
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}