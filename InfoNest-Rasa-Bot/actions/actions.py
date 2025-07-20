# InfoNest-Rasa-Bot/actions/actions.py

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import google.generativeai as genai
import os
import logging # Added for better logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Gemini API Configuration ---
# Load the API key from an environment variable.
# This variable MUST be set when you run your Docker container for actions.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables. Gemini integration will not work.")
    geminiModel = None
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Choose the appropriate model name, e.g., 'gemini-pro'
        geminiModel = genai.GenerativeModel('gemini-pro')
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")
        geminiModel = None
# --- End Gemini API Configuration ---


class ActionAskGeminiForUniversityInfo(Action):
    def name(self) -> Text:
        # This is the name you will refer to in your Rasa stories/rules
        return "action_ask_gemini_for_university_info"

    async def run(self, dispatcher: CollectingDispatcher,
                  tracker: Tracker,
                  domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        user_message = tracker.latest_message.get('text')
        # The user ID is available from the tracker if needed for context,
        # but typically not passed to Gemini unless you are tracking user-specific history.
        # userId = tracker.sender_id # This would be the sender ID from Rasa

        logger.info(f"Executing custom action: action_ask_gemini_for_university_info")
        logger.info(f"User message received: '{user_message}'")

        if not geminiModel:
            dispatcher.utter_message(text="Sorry, the AI assistant service is not configured properly.")
            return []

        try:
            # Construct a prompt for Gemini. Make it specific to Assumption University.
            prompt = f"""
            You are an AI assistant for Assumption University.
            Answer the following user query comprehensively and helpfully about Assumption University:
            User query: "{user_message}"
            Provide details about campus life, academics, admissions, or general university information.
            If the query is very specific, and you don't have exact details, politely state that and perhaps suggest checking the official AU website.
            """

            logger.info(f"Sending prompt to Gemini: '{prompt[:100]}...'") # Log a snippet of the prompt

            # Make the call to Gemini API.
            # The exact method might vary slightly based on the genai library version.
            # It's good to handle potential errors or empty responses.
            response = await geminiModel.generate_content_async(prompt)
            bot_response_text = response.text

            if not bot_response_text:
                bot_response_text = "I'm sorry, I couldn't get a specific answer from the AI assistant at this time. Please try again."
                logger.warning("Gemini API returned an empty response.")

            logger.info(f"Gemini API response received: '{bot_response_text[:100]}...'")

            # Dispatch the response to the user
            dispatcher.utter_message(text=bot_response_text)

        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            dispatcher.utter_message(text="Sorry, I encountered an error trying to get information. Please try again later.")

        return [] # Return empty list for no events

    # You can add other custom actions here if needed
    # from typing import Text # Make sure Text is imported if used elsewhere