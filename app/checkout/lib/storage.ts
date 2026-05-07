import { CheckoutDraft, CheckoutReceipt } from "./types";

const DRAFT_KEY = "brotherspvp_checkout_draft_v1";
const RECEIPT_KEY = "brotherspvp_checkout_receipt_v1";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadCheckoutDraft(): CheckoutDraft | null {
  return safeJsonParse<CheckoutDraft>(window.localStorage.getItem(DRAFT_KEY));
}

export function saveCheckoutDraft(draft: CheckoutDraft) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearCheckoutDraft() {
  window.localStorage.removeItem(DRAFT_KEY);
}

export function loadCheckoutReceipt(): CheckoutReceipt | null {
  return safeJsonParse<CheckoutReceipt>(window.localStorage.getItem(RECEIPT_KEY));
}

export function saveCheckoutReceipt(receipt: CheckoutReceipt) {
  window.localStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
}

export function clearCheckoutReceipt() {
  window.localStorage.removeItem(RECEIPT_KEY);
}

