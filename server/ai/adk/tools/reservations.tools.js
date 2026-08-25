import { FunctionTool } from "@google/adk";
import { checkAvailabilityTool } from "../../tools/reservations/checkAvailability.tool.js";
import { createReservationTool } from "../../tools/reservations/createReservation.tool.js";
import { getReservationTool } from "../../tools/reservations/getReservation.tool.js";
import { cancelReservationTool } from "../../tools/reservations/cancelReservation.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: checkAvailability
 * Real-time table availability check against operating hours and capacity.
 */
export const adkCheckAvailabilityTool = new FunctionTool({
  name: "checkAvailability",
  description:
    "Checks if a dining table is available for reservation on a specific date, time, and guest count. Use this when the customer asks if a table is available at a specific date/time.",
  parameters: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "Reservation date in YYYY-MM-DD format (e.g. '2025-05-10')",
      },
      time: {
        type: "string",
        description: "Reservation time in HH:MM format (e.g. '20:00')",
      },
      guestCount: {
        type: "number",
        description: "Number of guests (e.g. 4)",
      },
    },
  },
  execute: async ({ date, time, guestCount } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { error: "Missing restaurant context" };
    return checkAvailabilityTool.execute({ businessId, date, time, guestCount });
  },
});

/**
 * ADK FunctionTool wrapper: createReservation
 * Creates a table reservation in the restaurant database.
 */
export const adkCreateReservationTool = new FunctionTool({
  name: "createReservation",
  description:
    "Creates a new confirmed table reservation for a customer in the database. Use this when the customer wants to book/confirm a table.",
  parameters: {
    type: "object",
    properties: {
      reservationDate: {
        type: "string",
        description: "Date for the reservation in YYYY-MM-DD format",
      },
      reservationTime: {
        type: "string",
        description: "Time for the reservation in HH:MM format (e.g. '20:00')",
      },
      guestCount: {
        type: "number",
        description: "Number of guests (default is 2)",
      },
      notes: {
        type: "string",
        description: "Special requests or seating preferences",
      },
    },
    required: ["reservationDate"],
  },
  execute: async ({ reservationDate, reservationTime, guestCount, notes } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId || !customerId) return { error: "Customer context is required to create a reservation." };
    return createReservationTool.execute({ businessId, customerId, reservationDate, reservationTime, guestCount, notes });
  },
});

/**
 * ADK FunctionTool wrapper: getReservation
 */
export const adkGetReservationTool = new FunctionTool({
  name: "getReservation",
  description: "Fetches details, status, and timing of an existing table reservation by reservation number.",
  parameters: {
    type: "object",
    properties: {
      reservationNumber: {
        type: "string",
        description: "Reservation number (e.g. RES-123456)",
      },
    },
  },
  execute: async ({ reservationNumber } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId) return { error: "Missing restaurant context" };
    return getReservationTool.execute({ businessId, reservationNumber, customerId });
  },
});

/**
 * ADK FunctionTool wrapper: cancelReservation
 */
export const adkCancelReservationTool = new FunctionTool({
  name: "cancelReservation",
  description: "Cancels an existing table reservation in the database.",
  parameters: {
    type: "object",
    properties: {
      reservationNumber: {
        type: "string",
        description: "Reservation number to cancel (e.g. RES-123456)",
      },
    },
  },
  execute: async ({ reservationNumber } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId) return { error: "Missing restaurant context" };
    return cancelReservationTool.execute({ businessId, reservationNumber, customerId });
  },
});
