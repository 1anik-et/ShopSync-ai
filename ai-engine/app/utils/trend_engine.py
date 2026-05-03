from app.utils.llm_utils import get_hf_inference

class TrendEngine:
    """Scores fashion items on trendiness and longevity using Hugging Face AI"""

    def score(self, product_name: str, category: str = "General") -> dict:
        prompt = f"""[INST] You are a highly-attuned fashion trend forecaster AI.
Evaluate the current market trend for the following item.
Item: {product_name}
Category: {category}

Provide your analysis exactly in this format and nothing else:
Score: [a number from 1 to 100 representing current trend strength]
Direction: [one of: rising, stable, declining]
Peak: [e.g. Summer, Fall/Winter, Year-round, 2024]
Longevity: [one of: trendy, seasonal, timeless]
Recommendation: [A short 1 sentence recommendation on whether to buy it]
[/INST]"""

        result = get_hf_inference(prompt)

        score = 75.0
        direction = "stable"
        peak = "Year-round"
        longevity = "timeless"
        recommendation = "This is a solid core wardrobe piece."

        if "Warning:" not in result and "Error" not in result:
            try:
                for line in result.split('\n'):
                    if line.startswith("Score:"):
                        score_str = line.replace("Score:", "").strip()
                        score = float(''.join(c for c in score_str if c.isdigit() or c == '.'))
                    elif line.startswith("Direction:"):
                        direction = line.replace("Direction:", "").strip().lower()
                    elif line.startswith("Peak:"):
                        peak = line.replace("Peak:", "").strip()
                    elif line.startswith("Longevity:"):
                        longevity = line.replace("Longevity:", "").strip().lower()
                    elif line.startswith("Recommendation:"):
                        recommendation = line.replace("Recommendation:", "").strip()
            except Exception as e:
                print("Failed to parse trend:", e)

        return {
            "trend_score": min(100.0, max(0.0, score)),
            "trend_direction": direction if direction in ["rising", "stable", "declining"] else "stable",
            "peak_season": peak,
            "style_longevity": longevity if longevity in ["trendy", "seasonal", "timeless"] else "timeless",
            "recommendation": recommendation,
        }
