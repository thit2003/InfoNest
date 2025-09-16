"""
Minimal knowledge base lookup + context memory & disambiguation logic.

Add this file to your actions server (e.g., `actions/` directory) and
declare actions in domain.yml as shown earlier.

If you run with `rasa run actions`, ensure dependencies (if any) are installed.
"""

from typing import Any, Dict, List, Text, Optional
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

# --------------------------------------------------------------------
# SIMPLE IN-MEMORY KB (Replace with DB or external service later)
# --------------------------------------------------------------------
UNIVERSITY_KB = {
    "Assumption University": {
        "id": "ASSUMPTION_001",
        "definition": "Assumption University is a private Catholic university ... (sample).",
        "location": "Bangkok, Thailand",
        "founding_year": 1969,
        "ranking": "Top 500 Asia (illustrative)",
        "programs": ["Business Administration", "Engineering", "Arts", "Communication"],
    },
    "Harvard University": {
        "id": "HARVARD_001",
        "definition": "Harvard University is a private Ivy League research university in Cambridge, MA.",
        "location": "Cambridge, Massachusetts, USA",
        "founding_year": 1636,
        "ranking": "Often ranked #1 or near the top globally",
        "programs": ["Law", "Medicine", "Business", "Engineering", "Arts & Sciences"],
    },
    "Stanford": {
        "id": "STANFORD_001",
        "definition": "Stanford University is a private research university in Stanford, California.",
        "location": "Stanford, California, USA",
        "founding_year": 1885,
        "ranking": "Consistently top 5 globally",
        "programs": ["Computer Science", "Engineering", "Business", "Humanities", "Law"],
    },
    "MIT": {
        "id": "MIT_001",
        "definition": "Massachusetts Institute of Technology is a private land‑grant research university.",
        "location": "Cambridge, Massachusetts, USA",
        "founding_year": 1861,
        "ranking": "Top tier globally (often top 5)",
        "programs": ["Engineering", "Computer Science", "Architecture", "Management", "Physics"],
    },
}


def normalize_entity(name: Text) -> Optional[Text]:
    """Simple surface-form normalization. Expand for fuzzy matching."""
    if not name:
        return None
    # Direct exact or case-insensitive match
    lowered = name.lower().strip()
    for canonical in UNIVERSITY_KB.keys():
        if canonical.lower() == lowered:
            return canonical
    # You could add fuzzy matching (RapidFuzz) here
    return None


def entity_candidates_from_tracker(tracker: Tracker) -> List[Text]:
    """Return candidate entities from the last user turn (raw NLU) or from memory."""
    ents = []
    latest = tracker.latest_message.get("entities", [])
    for e in latest:
        if e.get("entity") == "organization":
            norm = normalize_entity(e.get("value"))
            if norm:
                ents.append(norm)
    # Fallback to memory if no new entities
    if not ents:
        current = tracker.get_slot("current_entity")
        if current:
            ents.append(current)
    return list(dict.fromkeys(ents))  # preserve order, remove dupes


def update_recent_entities(existing: List[Text], new_entity: Text) -> List[Text]:
    existing = existing or []
    combined = [new_entity] + [e for e in existing if e != new_entity]
    return combined[:5]


# --------------------------------------------------------------------
# ACTIONS
# --------------------------------------------------------------------
class ActionSetCurrentEntity(Action):
    def name(self) -> Text:
        return "action_set_current_entity"

    def run(
        self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict
    ) -> List:
        latest_entities = [
            e
            for e in tracker.latest_message.get("entities", [])
            if e.get("entity") == "organization"
        ]
        if not latest_entities:
            return []
        norm = normalize_entity(latest_entities[0]["value"])
        if not norm:
            dispatcher.utter_message(text="I couldn't identify that institution.")
            return []
        kb_entry = UNIVERSITY_KB.get(norm)
        recent = tracker.get_slot("recent_entities")
        return [
            SlotSet("current_entity", norm),
            SlotSet("current_entity_id", kb_entry["id"] if kb_entry else None),
            SlotSet("recent_entities", update_recent_entities(recent, norm)),
        ]


class BaseKnowledgeAction(Action):
    """Base with helper to get the entity context."""

    attribute: Text = ""
    fallback_response: Text = "I don't have data for {entity}."

    def resolve_entity(self, tracker: Tracker) -> Optional[Text]:
        # Check if a new entity was provided this turn
        ents = [
            e
            for e in tracker.latest_message.get("entities", [])
            if e.get("entity") == "organization"
        ]
        if ents:
            norm = normalize_entity(ents[0]["value"])
            if norm:
                return norm
        # Otherwise use current memory
        return tracker.get_slot("current_entity")

    def ask_for_entity_if_missing(self, dispatcher: CollectingDispatcher, tracker: Tracker) -> bool:
        if not self.resolve_entity(tracker):
            dispatcher.utter_message(response="utter_request_entity")
            return True
        return False

    def fetch_value(self, entity: Text) -> Optional[Any]:
        entry = UNIVERSITY_KB.get(entity)
        if not entry:
            return None
        if self.attribute == "definition":
            return entry.get("definition")
        return entry.get(self.attribute)

    def run(self, dispatcher, tracker, domain):
        if self.ask_for_entity_if_missing(dispatcher, tracker):
            return []
        entity = self.resolve_entity(tracker)
        value = self.fetch_value(entity)
        if not value:
            dispatcher.utter_message(text=self.fallback_response.format(entity=entity))
            return []
        self.respond(dispatcher, entity, value)
        # Ensure slots updated
        recent = tracker.get_slot("recent_entities")
        events = [
            SlotSet("current_entity", entity),
            SlotSet("current_entity_id", UNIVERSITY_KB[entity]["id"]),
            SlotSet("recent_entities", update_recent_entities(recent, entity)),
        ]
        return events

    def respond(self, dispatcher, entity: Text, value: Any):
        dispatcher.utter_message(text=f"{entity}: {value}")


class ActionDefineEntity(BaseKnowledgeAction):
    def name(self) -> Text:
        return "action_define_entity"

    attribute = "definition"


class ActionAnswerLocation(BaseKnowledgeAction):
    def name(self) -> Text:
        return "action_answer_location"

    attribute = "location"

    def respond(self, dispatcher, entity, value):
        dispatcher.utter_message(text=f"{entity} is located in {value}.")


class ActionAnswerFoundingYear(BaseKnowledgeAction):
    def name(self) -> Text:
        return "action_answer_founding_year"

    attribute = "founding_year"

    def respond(self, dispatcher, entity, value):
        dispatcher.utter_message(text=f"{entity} was founded in {value}.")


class ActionAnswerRanking(BaseKnowledgeAction):
    def name(self) -> Text:
        return "action_answer_ranking"

    attribute = "ranking"

    def respond(self, dispatcher, entity, value):
        dispatcher.utter_message(text=f"{entity}'s ranking: {value}.")


class ActionAnswerPrograms(BaseKnowledgeAction):
    def name(self) -> Text:
        return "action_answer_programs"

    attribute = "programs"

    def respond(self, dispatcher, entity, value):
        if isinstance(value, list):
            dispatcher.utter_message(
                text=f"{entity} offers programs such as: {', '.join(value[:6])}."
            )
        else:
            dispatcher.utter_message(text=f"{entity} programs: {value}")


class ActionDisambiguateEntity(Action):
    """If there are multiple recent entities and a pronoun-only question arrives."""

    def name(self) -> Text:
        return "action_disambiguate_entity"

    def run(self, dispatcher, tracker, domain):
        recent: List[Text] = tracker.get_slot("recent_entities") or []
        # If user just clarified (entity present), set current and continue
        latest_ents = [
            normalize_entity(e.get("value"))
            for e in tracker.latest_message.get("entities", [])
            if e.get("entity") == "organization"
        ]
        latest_ents = [e for e in latest_ents if e]

        if latest_ents:
            chosen = latest_ents[0]
            dispatcher.utter_message(text=f"Got it. We'll continue with {chosen}.")
            recent = update_recent_entities(recent, chosen)
            entry = UNIVERSITY_KB.get(chosen)
            return [
                SlotSet("current_entity", chosen),
                SlotSet("current_entity_id", entry["id"] if entry else None),
                SlotSet("recent_entities", recent),
                SlotSet("pending_disambiguation", None),
            ]

        pending = tracker.get_slot("pending_disambiguation")
        if not pending:
            # create pending list if multiple
            if len(recent) >= 2:
                opts = recent[:2]
                dispatcher.utter_message(
                    text=f"Do you mean {opts[0]} or {opts[1]}?"
                )
                return [SlotSet("pending_disambiguation", opts)]
            # If not enough to disambiguate just ask for entity
            dispatcher.utter_message(response="utter_request_entity")
            return []
        else:
            # We already asked; user still didn't clarify -> ask again politely
            dispatcher.utter_message(response="utter_request_entity")
            return []

class ActionResetContext(Action):
    def name(self) -> Text:
        return "action_reset_context"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(response="utter_context_cleared")
        return [
            SlotSet("current_entity", None),
            SlotSet("current_entity_id", None),
            SlotSet("recent_entities", []),
            SlotSet("pending_disambiguation", None),
        ]