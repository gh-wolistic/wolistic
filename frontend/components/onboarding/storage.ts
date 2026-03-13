const BOOKING_FLOW_AUTO_CLIENT_KEY = "wolistic_booking_flow_auto_client";

export function markBookingFlowAutoClientSelection(): void {
  window.sessionStorage.setItem(BOOKING_FLOW_AUTO_CLIENT_KEY, "1");
}

export function hasBookingFlowAutoClientSelection(): boolean {
  return window.sessionStorage.getItem(BOOKING_FLOW_AUTO_CLIENT_KEY) === "1";
}

export function clearBookingFlowAutoClientSelection(): void {
  window.sessionStorage.removeItem(BOOKING_FLOW_AUTO_CLIENT_KEY);
}