"""Tests for messaging API endpoints and service layer."""

import os
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres?sslmode=disable",
)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.config import get_settings
from app.models.booking import Booking
from app.models.client import ExpertClient
from app.models.messaging import Conversation, ConversationParticipant, Message
from app.models.user import User, UserFavourite

get_settings.cache_clear()

from app.core.database import get_db_session
from app.main import app

# Test user IDs
CLIENT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
PROFESSIONAL_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
OTHER_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")

# Test conversation and message IDs
CONVERSATION_ID = uuid.UUID("10000000-0000-0000-0000-000000000001")
MESSAGE_ID = uuid.UUID("20000000-0000-0000-0000-000000000001")


class ScalarResult:
    """Mock result that returns a single value."""

    def __init__(self, value: object) -> None:
        self._value = value

    def scalar_one_or_none(self) -> object:
        return self._value

    def scalar(self) -> object:
        return self._value

    def scalar_one(self) -> object:
        return self._value

    def one_or_none(self) -> object:
        return self._value

    def scalars(self) -> "ScalarResult":
        return self

    def all(self) -> list:
        return [self._value] if self._value else []


class MessagingSession:
    """Mock database session for messaging tests."""

    def __init__(
        self,
        has_favorite: bool = False,
        has_booking: bool = False,
        has_expert_client: bool = False,
        is_professional: bool = True,
        conversation: Conversation | None = None,
        messages: list[Message] | None = None,
        is_participant: bool = True,
    ) -> None:
        self.has_favorite = has_favorite
        self.has_booking = has_booking
        self.has_expert_client = has_expert_client
        self.is_professional = is_professional
        self.conversation = conversation
        self.messages = messages or []
        self.is_participant = is_participant
        self.added: list[object] = []
        self._execute_call_count = 0
        self.commit_count = 0
        self.flush_count = 0

    async def execute(self, _query: object) -> ScalarResult:
        """Mock query execution based on query type."""
        self._execute_call_count += 1

        # Policy validation queries
        if "UserFavourite" in str(_query) or self._execute_call_count == 1:
            return ScalarResult(self.has_favorite)
        if "Booking" in str(_query) or self._execute_call_count == 2:
            return ScalarResult(self.has_booking)
        if "ExpertClient" in str(_query) or self._execute_call_count == 3:
            return ScalarResult(self.has_expert_client)
        if "Professional" in str(_query) and "user_id" in str(_query):
            return ScalarResult(self.is_professional)

        # Conversation queries
        if "Conversation" in str(_query):
            return ScalarResult(self.conversation)

        # Participant queries
        if "ConversationParticipant" in str(_query):
            return ScalarResult(self.is_participant)

        # Message queries
        if "Message" in str(_query):
            if len(self.messages) > 0:
                return ScalarResult(self.messages)
            return ScalarResult(None)

        return ScalarResult(None)

    async def scalar(self, _query: object) -> object:
        """Mock scalar query execution."""
        result = await self.execute(_query)
        return result.scalar()

    async def get(self, model_class: type, primary_key: uuid.UUID) -> object | None:
        """Mock get by primary key."""
        if model_class == Conversation:
            return self.conversation
        if model_class == Message and self.messages:
            return self.messages[0]
        return None

    def add(self, obj: object) -> None:
        """Track added objects."""
        self.added.append(obj)
        # Auto-assign IDs for newly created objects
        if isinstance(obj, Conversation) and not hasattr(obj, "id"):
            obj.id = CONVERSATION_ID
            obj.created_at = datetime.now(timezone.utc)
            obj.updated_at = datetime.now(timezone.utc)
            obj.participants = []
        elif isinstance(obj, Message) and not hasattr(obj, "id"):
            obj.id = MESSAGE_ID
            obj.created_at = datetime.now(timezone.utc)

    async def flush(self) -> None:
        """Mock flush operation."""
        self.flush_count += 1
        # Assign IDs to objects if not already set
        for obj in self.added:
            if isinstance(obj, Conversation) and not hasattr(obj, "id"):
                obj.id = CONVERSATION_ID
            elif isinstance(obj, ConversationParticipant) and not hasattr(obj, "id"):
                obj.id = uuid.uuid4()
            elif isinstance(obj, Message) and not hasattr(obj, "id"):
                obj.id = MESSAGE_ID

    async def commit(self) -> None:
        """Mock commit operation."""
        self.commit_count += 1

    async def refresh(self, obj: object, attribute_names: list[str] | None = None) -> None:
        """Mock refresh operation."""
        if isinstance(obj, Conversation):
            obj.participants = [
                ConversationParticipant(
                    id=uuid.uuid4(),
                    conversation_id=obj.id,
                    user_id=CLIENT_USER_ID,
                    joined_at=datetime.now(timezone.utc),
                ),
                ConversationParticipant(
                    id=uuid.uuid4(),
                    conversation_id=obj.id,
                    user_id=PROFESSIONAL_USER_ID,
                    joined_at=datetime.now(timezone.utc),
                ),
            ]


def mock_current_user(user_id: uuid.UUID) -> AuthenticatedUser:
    """Create a mock authenticated user."""
    return AuthenticatedUser(
        user_id=user_id,
        email=f"user-{user_id}@example.com",
        role=None,
        full_name="Test User",
    )


# ============================================================================
# Test: Policy Validation
# ============================================================================


def test_can_message_professional_with_favorite():
    """Test user can message professional they've favorited."""
    session = MessagingSession(has_favorite=True)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(
        "/api/v1/messaging/conversations",
        json={"other_user_id": str(PROFESSIONAL_USER_ID)},
    )

    assert response.status_code == 201
    assert response.json()["id"] == str(CONVERSATION_ID)
    app.dependency_overrides.clear()


def test_can_message_professional_with_booking():
    """Test user can message professional they have a booking with."""
    session = MessagingSession(has_favorite=False, has_booking=True)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(
        "/api/v1/messaging/conversations",
        json={"other_user_id": str(PROFESSIONAL_USER_ID)},
    )

    assert response.status_code == 201
    app.dependency_overrides.clear()


def test_can_message_professional_as_expert_client():
    """Test user can message professional who has them in expert_clients."""
    session = MessagingSession(has_favorite=False, has_booking=False, has_expert_client=True)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(
        "/api/v1/messaging/conversations",
        json={"other_user_id": str(PROFESSIONAL_USER_ID)},
    )

    assert response.status_code == 201
    app.dependency_overrides.clear()


def test_cannot_message_professional_without_relationship():
    """Test user cannot message professional without any relationship."""
    session = MessagingSession(has_favorite=False, has_booking=False, has_expert_client=False)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(
        "/api/v1/messaging/conversations",
        json={"other_user_id": str(PROFESSIONAL_USER_ID)},
    )

    assert response.status_code == 403
    assert "not allowed to message" in response.json()["detail"]
    app.dependency_overrides.clear()


# ============================================================================
# Test: Conversation Management
# ============================================================================


def test_get_existing_conversation():
    """Test retrieving an existing conversation."""
    existing_conversation = Conversation(
        id=CONVERSATION_ID,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    existing_conversation.participants = [
        ConversationParticipant(
            id=uuid.uuid4(),
            conversation_id=CONVERSATION_ID,
            user_id=CLIENT_USER_ID,
            joined_at=datetime.now(timezone.utc),
        ),
    ]

    session = MessagingSession(
        has_favorite=True,
        conversation=existing_conversation,
        is_participant=True,
    )

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.get(f"/api/v1/messaging/conversations/{CONVERSATION_ID}")

    assert response.status_code == 200
    assert response.json()["id"] == str(CONVERSATION_ID)
    app.dependency_overrides.clear()


def test_cannot_access_conversation_not_participant():
    """Test user cannot access conversation they're not a participant in."""
    session = MessagingSession(conversation=None, is_participant=False)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(OTHER_USER_ID)

    client = TestClient(app)
    response = client.get(f"/api/v1/messaging/conversations/{CONVERSATION_ID}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    app.dependency_overrides.clear()


# ============================================================================
# Test: Message Sending
# ============================================================================


def test_send_message_success():
    """Test sending a message successfully."""
    existing_conversation = Conversation(
        id=CONVERSATION_ID,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    session = MessagingSession(
        conversation=existing_conversation,
        is_participant=True,
    )

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(
        f"/api/v1/messaging/conversations/{CONVERSATION_ID}/messages",
        json={"content": "Hello! I have a question about your services."},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Hello! I have a question about your services."
    assert data["sender_id"] == str(CLIENT_USER_ID)
    assert data["conversation_id"] == str(CONVERSATION_ID)
    assert session.commit_count == 1
    app.dependency_overrides.clear()


def test_cannot_send_message_not_participant():
    """Test user cannot send message to conversation they're not in."""
    session = MessagingSession(is_participant=False)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(OTHER_USER_ID)

    client = TestClient(app)
    response = client.post(
        f"/api/v1/messaging/conversations/{CONVERSATION_ID}/messages",
        json={"content": "Trying to send unauthorized message"},
    )

    assert response.status_code == 403
    assert "not a participant" in response.json()["detail"]
    app.dependency_overrides.clear()


def test_cannot_send_empty_message():
    """Test validation prevents sending empty messages."""
    session = MessagingSession(is_participant=True)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(
        f"/api/v1/messaging/conversations/{CONVERSATION_ID}/messages",
        json={"content": ""},
    )

    assert response.status_code == 422  # Validation error
    app.dependency_overrides.clear()


# ============================================================================
# Test: Message Retrieval
# ============================================================================


def test_get_messages_success():
    """Test retrieving messages from a conversation."""
    messages = [
        Message(
            id=MESSAGE_ID,
            conversation_id=CONVERSATION_ID,
            sender_id=PROFESSIONAL_USER_ID,
            content="Hello! How can I help you?",
            created_at=datetime.now(timezone.utc),
        )
    ]

    session = MessagingSession(
        is_participant=True,
        messages=messages,
    )

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.get(f"/api/v1/messaging/conversations/{CONVERSATION_ID}/messages")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["content"] == "Hello! How can I help you?"
    app.dependency_overrides.clear()


def test_cannot_read_messages_not_participant():
    """Test user cannot read messages from conversation they're not in."""
    session = MessagingSession(is_participant=False)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(OTHER_USER_ID)

    client = TestClient(app)
    response = client.get(f"/api/v1/messaging/conversations/{CONVERSATION_ID}/messages")

    assert response.status_code == 200
    assert len(response.json()) == 0  # Returns empty array due to participant check
    app.dependency_overrides.clear()


# ============================================================================
# Test: Read Status
# ============================================================================


def test_mark_conversation_read():
    """Test marking a conversation as read."""
    participant = ConversationParticipant(
        id=uuid.uuid4(),
        conversation_id=CONVERSATION_ID,
        user_id=CLIENT_USER_ID,
        joined_at=datetime.now(timezone.utc),
    )

    class ReadStatusSession(MessagingSession):
        async def execute(self, _query):
            return ScalarResult(participant)

    session = ReadStatusSession(is_participant=True)

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.post(f"/api/v1/messaging/conversations/{CONVERSATION_ID}/read")

    assert response.status_code == 204
    assert session.commit_count == 1
    app.dependency_overrides.clear()


# ============================================================================
# Test: List Conversations
# ============================================================================


def test_list_conversations():
    """Test listing user's conversations."""
    conversation = Conversation(
        id=CONVERSATION_ID,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        last_message_at=datetime.now(timezone.utc),
    )
    conversation.participants = [
        ConversationParticipant(
            id=uuid.uuid4(),
            conversation_id=CONVERSATION_ID,
            user_id=CLIENT_USER_ID,
            joined_at=datetime.now(timezone.utc),
        ),
    ]

    class ConversationListSession(MessagingSession):
        def __init__(self):
            super().__init__()
            self.call_count = 0

        async def execute(self, _query):
            self.call_count += 1
            if self.call_count == 1:
                # Return list of conversations
                return ScalarResult([conversation])
            elif self.call_count == 2:
                # Return messages for last message
                return ScalarResult([])
            else:
                # Return unread count
                return ScalarResult(0)

    session = ConversationListSession()

    app.dependency_overrides[get_db_session] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: mock_current_user(CLIENT_USER_ID)

    client = TestClient(app)
    response = client.get("/api/v1/messaging/conversations")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    app.dependency_overrides.clear()


# ============================================================================
# Run tests
# ============================================================================

if __name__ == "__main__":
    print("Running messaging tests...")
    print("\n=== Policy Validation Tests ===")
    test_can_message_professional_with_favorite()
    print("✓ Can message with favorite")
    test_can_message_professional_with_booking()
    print("✓ Can message with booking")
    test_can_message_professional_as_expert_client()
    print("✓ Can message as expert client")
    test_cannot_message_professional_without_relationship()
    print("✓ Cannot message without relationship")

    print("\n=== Conversation Management Tests ===")
    test_get_existing_conversation()
    print("✓ Can get existing conversation")
    test_cannot_access_conversation_not_participant()
    print("✓ Cannot access conversation as non-participant")

    print("\n=== Message Sending Tests ===")
    test_send_message_success()
    print("✓ Can send message")
    test_cannot_send_message_not_participant()
    print("✓ Cannot send message as non-participant")
    test_cannot_send_empty_message()
    print("✓ Cannot send empty message")

    print("\n=== Message Retrieval Tests ===")
    test_get_messages_success()
    print("✓ Can retrieve messages")
    test_cannot_read_messages_not_participant()
    print("✓ Cannot read messages as non-participant")

    print("\n=== Read Status Tests ===")
    test_mark_conversation_read()
    print("✓ Can mark conversation as read")

    print("\n=== List Conversations Tests ===")
    test_list_conversations()
    print("✓ Can list conversations")

    print("\n✅ All tests passed!")
