from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class BookingQuestionOut(BaseModel):
    id: int
    prompt: str
    display_order: int
    is_required: bool = True


class BookingQuestionsPageOut(BaseModel):
    questions: list[BookingQuestionOut] = []
    already_answered: bool = False


class PromotionalEligibilityOut(BaseModel):
    eligible: bool = True
    already_claimed: bool = False


class BookingQuestionAnswerIn(BaseModel):
    question_id: int = Field(gt=0)
    answer: str = Field(min_length=1, max_length=4000)


class SubmitBookingAnswersIn(BaseModel):
    answers: list[BookingQuestionAnswerIn]


class SubmitBookingAnswersOut(BaseModel):
    saved: bool
    already_answered: bool


class CreatePaymentOrderIn(BaseModel):
    amount: float = Field(ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    professional_username: str = Field(min_length=2, max_length=100)
    service_name: str = Field(min_length=1, max_length=255)
    customer_name: str | None = Field(default=None, max_length=255)
    customer_email: str | None = Field(default=None, max_length=255)
    booking_at: datetime | None = None
    is_immediate: bool = False


class CreatePaymentOrderOut(BaseModel):
    mode: str = "mock"  # "mock" | "live" | "free"
    key_id: str = "rzp_test_mock"
    order_id: str
    booking_reference: str
    amount_subunits: int
    currency: str


class VerifyPaymentIn(BaseModel):
    razorpay_order_id: str = Field(min_length=3, max_length=128)
    razorpay_payment_id: str = Field(min_length=3, max_length=128)
    razorpay_signature: str = Field(min_length=3, max_length=512)
    booking_reference: str = Field(min_length=4, max_length=64)
    next_route: str | None = "/authorized"
    professional_username: str = Field(min_length=2, max_length=100)
    service_name: str = Field(min_length=1, max_length=255)
    booking_at: datetime | None = None
    is_immediate: bool = False


class VerifyPaymentOut(BaseModel):
    status: str
    nextRoute: str
    booking_reference: str


class BookingHistoryItemOut(BaseModel):
    booking_reference: str
    professional_username: str
    service_name: str
    status: str
    scheduled_for: datetime | None = None
    is_immediate: bool = False
    created_at: datetime
    payment_status: str | None = None


class BookingHistoryOut(BaseModel):
    latest_booking: BookingHistoryItemOut | None = None
    next_booking: BookingHistoryItemOut | None = None
    immediate_bookings: list[BookingHistoryItemOut] = []
    upcoming_bookings: list[BookingHistoryItemOut] = []
    past_bookings: list[BookingHistoryItemOut] = []
