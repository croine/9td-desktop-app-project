import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export function VerificationEmail({
  name,
  verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address to access 9TD Task Dashboard</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Row>
              <Text style={heading}>🎯 Verify Your Email</Text>
            </Row>
            <Text style={paragraph}>
              Hi {name},
            </Text>
            <Text style={paragraph}>
              Thank you for registering with 9TD Task Dashboard! We're excited to have you on board.
            </Text>
            <Text style={paragraph}>
              Please verify your email address by clicking the button below to complete your registration and start organizing your tasks:
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>
            <Text style={paragraph}>
              Or copy and paste this URL into your browser:
            </Text>
            <Link href={verificationUrl} style={link}>
              {verificationUrl}
            </Link>
            <Hr style={hr} />
            <Text style={footer}>
              <strong>⏰ This link expires in 1 hour</strong>
            </Text>
            <Text style={footer}>
              If you didn't create an account with 9TD, you can safely ignore this email.
            </Text>
            <Text style={footer}>
              Need help? Contact us at support@9td.app
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const box = {
  padding: "0 48px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#1f2937",
  margin: "24px 0",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "left" as const,
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const link = {
  color: "#6366f1",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
  display: "block",
  margin: "16px 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "8px 0",
};
