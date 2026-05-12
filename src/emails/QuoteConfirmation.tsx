import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Quote } from "@/lib/interfaces";

interface QuoteConfirmationProps {
  quote: Quote;
  shopInfo: {
    businessName: string;
    phone: string;
    email: string;
    address: string;
  };
}

export const QuoteConfirmation = ({
  quote,
  shopInfo,
}: QuoteConfirmationProps) => {
  const previewText = `Quote Request ${quote.quoteReference} - We'll get back to you soon!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Quote Request Received!</Heading>
          
          <Text style={text}>
            Hi {quote.customerInfo.name},
          </Text>
          
          <Text style={text}>
            Thank you for requesting a quote from {shopInfo.businessName}.
            We&apos;ve received your request and our team will review it shortly.
          </Text>

          <Section style={informationTable}>
            <Text style={informationTableLabel}>Quote Reference:</Text>
            <Text style={informationTableValue}>{quote.quoteReference}</Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Vehicle Information
          </Heading>
          
          <Section style={informationTable}>
            <Text style={informationTableRow}>
              <strong>Make:</strong> {quote.vehicle.make}
            </Text>
            <Text style={informationTableRow}>
              <strong>Model:</strong> {quote.vehicle.model}
            </Text>
            <Text style={informationTableRow}>
              <strong>Year:</strong> {quote.vehicle.year}
            </Text>
            {quote.vehicle.registration && (
              <Text style={informationTableRow}>
                <strong>Registration:</strong> {quote.vehicle.registration}
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Service Details
          </Heading>
          
          <Section style={informationTable}>
            <Text style={informationTableRow}>
              <strong>Service Type:</strong> {quote.serviceType}
            </Text>
            {quote.serviceDetails && (
              <Text style={informationTableRow}>
                <strong>Details:</strong> {quote.serviceDetails}
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            What Happens Next?
          </Heading>

          <Text style={text}>
            Our team will review your request and contact you within 24-48 hours 
            with a detailed quote. If you have any urgent questions, feel free 
            to contact us directly.
          </Text>

          <Section style={informationTable}>
            <Text style={informationTableRow}>
              <strong>Phone:</strong> {shopInfo.phone}
            </Text>
            <Text style={informationTableRow}>
              <strong>Email:</strong>{" "}
              <Link href={`mailto:${shopInfo.email}`} style={link}>
                {shopInfo.email}
              </Link>
            </Text>
            <Text style={informationTableRow}>
              <strong>Address:</strong> {shopInfo.address}
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated confirmation email for quote request{" "}
            <strong>{quote.quoteReference}</strong>. Please keep this reference 
            number for your records.
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} {shopInfo.businessName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default QuoteConfirmation;

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
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "20px 0 12px",
  padding: "0 40px",
};

const text = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  padding: "0 40px",
};

const informationTable = {
  padding: "0 40px",
  margin: "12px 0",
};

const informationTableRow = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const informationTableLabel = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0",
};

const informationTableValue = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#dc2626",
  margin: "4px 0 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
  margin: "12px 0",
};

const link = {
  color: "#dc2626",
  textDecoration: "underline",
};
