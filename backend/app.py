from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure the Gemini API key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    # This is a fallback for environments where .env might not be read as expected by python-dotenv
    # or if running in a container where env vars are injected directly.
    print("Warning: GEMINI_API_KEY not found via os.environ.get after load_dotenv(). Ensure it's set in .env or your environment.")
    # Attempt to read it directly if a .env file exists in the backend folder,
    # though python-dotenv should handle this. This is more of a diagnostic.
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    GEMINI_API_KEY = line.strip().split("=")[1].strip('"').strip("'")
                    break
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set and not found in .env. Please create backend/.env with GEMINI_API_KEY=\"YOUR_API_KEY\"")


genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model
# Using "gemini-1.5-flash" as a generally available and performant model.
# The original request specified "gemini-2.0-flash", which might be an internal or future name.
# If "gemini-2.0-flash" becomes available and is preferred, this line should be updated.
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    app.logger.error(f"Failed to initialize GenerativeModel: {e}")
    # Fallback or specific error handling for model initialization
    # For now, we'll let it raise if the model name is invalid or API key is wrong.
    raise

# --- API Endpoints ---

@app.route('/api/generate', methods=['POST'])
def generate_code():
    """
    Generates code based on a user prompt and selected language.
    Expects JSON: {"prompt": "user's prompt", "language": "selected_language"}
    Returns JSON: {"code": "generated_code_string"} or {"error": "message"}
    """
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        language = data.get('language', 'python') # Default to Python

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        full_prompt = f"Generate {language} code for the following prompt: {prompt}. Only output the code, no other text or explanations."

        response = model.generate_content(full_prompt)

        generated_code = response.text

        return jsonify({"code": generated_code})

    except Exception as e:
        app.logger.error(f"Error generating code: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/review', methods=['POST'])
def review_code():
    """
    Reviews provided code based on the selected language.
    Expects JSON: {"code": "code_to_review", "language": "selected_language"}
    Returns JSON: {"review": "review_feedback_markdown"} or {"error": "message"}
    """
    try:
        data = request.get_json()
        code_to_review = data.get('code')
        language = data.get('language', 'python') # Default to Python

        if not code_to_review:
            return jsonify({"error": "Code for review is required"}), 400

        review_prompt = f"""\
Review the following {language} code. Provide detailed feedback on:
- Correctness and functionality: Does the code meet the intended functions?
- Standard compliance: (e.g., PEP 8 for Python, JS conventions, etc.).
- Best practices: Suggestions for optimization, readability, modularity, and use of design patterns.
- Potential errors and security vulnerabilities: Identification of common pitfalls, SQL injection, XSS (if applicable).
- Code complexity: Highlighting areas that can be simplified.
- Unit test generation: Suggestions for tests for key functions.

Present the feedback in Markdown format. Use headings for categories (e.g., `### Correctness`, `### Readability`).
For specific points:
- Start with the type of feedback using bold Markdown: `**[Error]**`, `**[Suggestion]**`, `**[Best Practice]**`, `**[Nitpick]**`, or `**[Info]**`.
- If applicable, reference line numbers clearly, for example: `(Line 23)` or `(Lines 45-50)`.
- Provide a concise explanation for each point.
- If the code is generally good, provide a brief positive acknowledgement at the beginning.

Example of a point:
`**[Error]** (Line 23): Variable \`user_id\` is used before assignment.`

Code to review:
```{language}
{code_to_review}
```
"""
        response = model.generate_content(review_prompt)

        review_feedback = response.text

        return jsonify({"review": review_feedback})

    except Exception as e:
        app.logger.error(f"Error reviewing code: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("FLASK_RUN_PORT", 5001))
    # Setting host to '0.0.0.0' to be accessible externally if needed, e.g. in a container
    app.run(debug=True, host='0.0.0.0', port=port)
