import React from "react";
import { render, screen } from "@testing-library/react";
import { JsonLd } from "@/components/SEO/JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const data = { "@type": "Organization", name: "Test Motors" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
  });

  it("contains serialized JSON data", () => {
    const data = { "@type": "Organization", name: "Test Motors" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const content = script?.innerHTML || "";
    expect(content).toContain("Organization");
    expect(content).toContain("Test Motors");
  });

  it("escapes < characters to prevent XSS", () => {
    const data = { name: "</script><img src=x onerror=alert(1)>" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const content = script?.innerHTML || "";
    expect(content).not.toContain("</script>");
    expect(content).toContain("\\u003c");
  });

  it("handles nested objects", () => {
    const data = {
      "@type": "Product",
      offers: { price: "25000", currency: "GBP" },
    };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    const content = script?.innerHTML || "";
    expect(content).toContain("25000");
    expect(content).toContain("GBP");
  });
});
