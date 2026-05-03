import os
import requests
import json

def get_hf_inference(prompt: str) -> str:
    """Uses a Hugging Face API to generate text based on the prompt."""
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key:
        return "Warning: HUGGINGFACE_API_KEY not configured. Please set it in your .env file."
    
    # We use a relatively capable but fast model on the Free Inference API
    # Optional: meta-llama/Meta-Llama-3-8B-Instruct or mistralai/Mistral-7B-Instruct-v0.2
    API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    headers = {"Authorization": f"Bearer {api_key}"}

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 200,
            "temperature": 0.7,
            "return_full_text": False
        }
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            return response.json()[0]['generated_text'].strip()
        else:
            print(f"HF Error Status {response.status_code}: {response.text}")
            return f"Error from generation model: {response.status_code}"
    except Exception as e:
        print(f"Exception calling HF AI: {e}")
        return "Failed to connect to AI Engine."
