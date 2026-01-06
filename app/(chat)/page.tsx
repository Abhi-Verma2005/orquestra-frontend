import React from "react";

import { auth } from "../../app/(auth)/auth";
import { Chat as Landing} from "../../components/custom/Landing";
import { generateUUID } from "../../lib/utils";

export default async function Page() {
  const id = generateUUID();
  const session = await auth();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AI Chat",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered chat assistant for smart conversations and collaboration.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Landing initialMessages={[]} />
    </>
  );
}
