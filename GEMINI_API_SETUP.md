# Gemini API Setup Instructions

## Current Status
The Mock Interview feature is currently using fallback questions because the Gemini API key is set to `PLACEHOLDER_API_KEY`.

## To Enable AI-Generated Questions:

1. Get a Gemini API key from Google AI Studio: https://makersuite.google.com/app/apikey

2. Update your `.env.local` file:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server

## Fallback Behavior
When the API key is not configured, the system will:
- Show a console error about the missing API key
- Use pre-defined fallback questions that are still relevant and useful
- Continue to function normally for users

## Testing
The Mock Interview feature will work with or without the API key, ensuring a good user experience regardless of configuration.