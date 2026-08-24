import prisma from "../../../config/prisma.js";
import { KNOWLEDGE_DOCUMENT_TYPES } from "./document.types.js";

/**
 * Builds logically separated KnowledgeDocument items from restaurant database models
 */
export async function buildKnowledgeDocuments(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      knowledge: true,
      hours: true,
    },
  });

  if (!business) {
    throw new Error(`Business with ID ${businessId} not found`);
  }

  const knowledge = business.knowledge || {};
  const hours = business.hours || [];
  const docs = [];

  // Document 1: Business Identity & Overview
  const identityContent = [
    `Restaurant Name: ${business.name || "Restaurant"}`,
    business.city ? `Location City: ${business.city}` : null,
    business.country ? `Country: ${business.country}` : null,
    knowledge.businessIdentity ? `Identity & Story: ${knowledge.businessIdentity}` : null,
  ].filter(Boolean).join("\n");

  docs.push({
    businessId,
    type: KNOWLEDGE_DOCUMENT_TYPES.BUSINESS,
    title: `${business.name || "Restaurant"} - Identity & Overview`,
    content: identityContent,
    sourceType: "Business",
    sourceId: business.id,
  });

  // Document 2: Contact Information
  const contactContent = [
    `Restaurant Name: ${business.name || "Restaurant"}`,
    business.address ? `Address: ${business.address}, ${business.city || ""}` : null,
    business.phone ? `Phone Contact: ${business.phone}` : null,
    business.email ? `Email Contact: ${business.email}` : null,
    business.website ? `Official Website: ${business.website}` : null,
  ].filter(Boolean).join("\n");

  docs.push({
    businessId,
    type: KNOWLEDGE_DOCUMENT_TYPES.BUSINESS,
    title: `${business.name || "Restaurant"} - Contact Information`,
    content: contactContent,
    sourceType: "Business",
    sourceId: business.id,
  });

  // Document 3: Food Variety & Cuisine Summary
  if (knowledge.foodVariety) {
    docs.push({
      businessId,
      type: KNOWLEDGE_DOCUMENT_TYPES.FOOD,
      title: `${business.name || "Restaurant"} - Food Variety & Specialties`,
      content: `Food & Menu Specialties:\n${knowledge.foodVariety}`,
      sourceType: "BusinessKnowledge",
      sourceId: knowledge.id,
    });
  }

  // Document 4: Delivery Information
  if (knowledge.deliveryInformation) {
    docs.push({
      businessId,
      type: KNOWLEDGE_DOCUMENT_TYPES.DELIVERY,
      title: `${business.name || "Restaurant"} - Delivery Policy & Areas`,
      content: `Delivery Information:\n${knowledge.deliveryInformation}`,
      sourceType: "BusinessKnowledge",
      sourceId: knowledge.id,
    });
  }

  // Document 5: Payment Methods
  if (knowledge.paymentInformation) {
    docs.push({
      businessId,
      type: KNOWLEDGE_DOCUMENT_TYPES.PAYMENT,
      title: `${business.name || "Restaurant"} - Payment Methods & Policy`,
      content: `Payment Information:\n${knowledge.paymentInformation}`,
      sourceType: "BusinessKnowledge",
      sourceId: knowledge.id,
    });
  }

  // Document 6: Reservation Policy
  if (knowledge.reservationInformation) {
    docs.push({
      businessId,
      type: KNOWLEDGE_DOCUMENT_TYPES.RESERVATION,
      title: `${business.name || "Restaurant"} - Table Reservation Policy`,
      content: `Reservation Information:\n${knowledge.reservationInformation}`,
      sourceType: "BusinessKnowledge",
      sourceId: knowledge.id,
    });
  }

  // Document 7: Business Hours
  if (hours.length > 0) {
    const hoursLines = hours.map((h) => {
      if (!h.isOpen) return `${h.dayOfWeek}: Closed`;
      return `${h.dayOfWeek}: ${h.open || "09:00"} to ${h.close || "22:00"}`;
    });

    docs.push({
      businessId,
      type: KNOWLEDGE_DOCUMENT_TYPES.HOURS,
      title: `${business.name || "Restaurant"} - Operating Hours`,
      content: `Restaurant Operating Hours:\n${hoursLines.join("\n")}`,
      sourceType: "BusinessHour",
      sourceId: business.id,
    });
  }

  return docs;
}
