export const LEARNING_FRENCH_OPTIONS = ["Yes", "No", "I speak French already"] as const;
export const FRENCH_LEVEL_OPTIONS = [
  "Complete beginner",
  "A1–A2 (Elementary)",
  "B1–B2 (Intermediate)",
  "Fluent / Native speaker",
] as const;
export const MOTIVATION_OPTIONS = [
  "Career opportunities",
  "Education / scholarships",
  "Travel or relocation",
  "Business and networking",
  "Personal interest and cultural discovery",
  "Communication",
  "Other",
] as const;
export const HOPING_TO_GAIN_OPTIONS = [
  "Improve my French-speaking confidence",
  "Meet other French speakers and learners",
  "Discover French and Francophone cultures",
  "Learn from talks and discussions",
  "Enjoy gastronomy and food experiences",
  "Have fun and enjoy the experiences",
  "Other",
] as const;
export const HEARD_FROM_OPTIONS = [
  "Instagram",
  "TikTok",
  "WhatsApp",
  "A friend / Referral",
  "Other",
] as const;
export const FOLLOWING_SOCIAL_OPTIONS = ["Yes", "Not yet"] as const;

export type CommunityRsvpInput = {
  email: string;
  fullName: string;
  ticketName: string;
  whatsapp: string;
  learningFrench: string;
  frenchLevel: string;
  motivations: string[];
  motivationsOther?: string;
  hopingToGain: string[];
  hopingToGainOther?: string;
  expectingMost: string;
  allergies: string;
  heardFrom: string;
  heardFromOther?: string;
  followingSocial: string;
};

export type CommunityRsvpRecord = CommunityRsvpInput & {
  id: string;
  createdAt: string;
};

export function validateCommunityRsvp(body: Partial<CommunityRsvpInput>) {
  const email = body.email?.trim() ?? "";
  const fullName = body.fullName?.trim() ?? "";
  const ticketName = body.ticketName?.trim() ?? "";
  const whatsapp = body.whatsapp?.trim() ?? "";
  const learningFrench = body.learningFrench?.trim() ?? "";
  const frenchLevel = body.frenchLevel?.trim() ?? "";
  const motivations = Array.isArray(body.motivations) ? body.motivations.map((item) => item.trim()).filter(Boolean) : [];
  const motivationsOther = body.motivationsOther?.trim() ?? "";
  const hopingToGain = Array.isArray(body.hopingToGain) ? body.hopingToGain.map((item) => item.trim()).filter(Boolean) : [];
  const hopingToGainOther = body.hopingToGainOther?.trim() ?? "";
  const expectingMost = body.expectingMost?.trim() ?? "";
  const allergies = body.allergies?.trim() ?? "";
  const heardFrom = body.heardFrom?.trim() ?? "";
  const heardFromOther = body.heardFromOther?.trim() ?? "";
  const followingSocial = body.followingSocial?.trim() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return { error: "Please enter a valid email." };
  }
  if (!fullName || fullName.length > 120) return { error: "Please enter your full name." };
  if (!ticketName || ticketName.length > 80) return { error: "Please enter the name for your ticket." };
  if (!whatsapp || whatsapp.length > 40) return { error: "Please enter your WhatsApp number." };
  if (!LEARNING_FRENCH_OPTIONS.includes(learningFrench as (typeof LEARNING_FRENCH_OPTIONS)[number])) {
    return { error: "Please tell us if you are learning French." };
  }
  if (!FRENCH_LEVEL_OPTIONS.includes(frenchLevel as (typeof FRENCH_LEVEL_OPTIONS)[number])) {
    return { error: "Please choose your current French level." };
  }
  if (!motivations.length) return { error: "Please choose at least one motivation." };
  if (motivations.includes("Other") && !motivationsOther) return { error: "Please describe your other motivation." };
  if (!hopingToGain.length) return { error: "Please choose what you hope to gain." };
  if (hopingToGain.includes("Other") && !hopingToGainOther) return { error: "Please describe what else you hope to gain." };
  if (!expectingMost || expectingMost.length > 500) return { error: "Please share what you are expecting most." };
  if (!allergies || allergies.length > 400) return { error: "Please share allergies or write None." };
  if (!HEARD_FROM_OPTIONS.includes(heardFrom as (typeof HEARD_FROM_OPTIONS)[number])) {
    return { error: "Please tell us how you heard about Parle & Sip." };
  }
  if (heardFrom === "Other" && !heardFromOther) return { error: "Please tell us how you heard about us." };
  if (!FOLLOWING_SOCIAL_OPTIONS.includes(followingSocial as (typeof FOLLOWING_SOCIAL_OPTIONS)[number])) {
    return { error: "Please tell us if you follow us on social media." };
  }

  return {
    data: {
      email,
      fullName,
      ticketName,
      whatsapp,
      learningFrench,
      frenchLevel,
      motivations,
      motivationsOther: motivations.includes("Other") ? motivationsOther : "",
      hopingToGain,
      hopingToGainOther: hopingToGain.includes("Other") ? hopingToGainOther : "",
      expectingMost,
      allergies,
      heardFrom,
      heardFromOther: heardFrom === "Other" ? heardFromOther : "",
      followingSocial,
    } satisfies CommunityRsvpInput,
  };
}
