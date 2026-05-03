from app.utils.llm_utils import get_hf_inference

class ColorEngine:
    """Generates fashion-aware color palette recommendations using Hugging Face AI"""

    def match(self, primary_color: str, style: str = "complementary") -> dict:
        prompt = f"""[INST] You are an expert fashion colorist AI.
Given the primary color: '{primary_color}' and the strategy: '{style}',
provide a highly-curated color palette.

Output exactly in this format and nothing else:
Suggested: color1, color2, color3
Avoid: color4, color5
Tip: One sentence advice on how to wear this.
[/INST]"""

        result = get_hf_inference(prompt)
        
        suggested = ["white", "black", "grey"]
        avoid = ["neon"]
        tip = "Neutral colors are always a safe bet."

        if "Warning:" not in result and "Error" not in result:
            try:
                for line in result.split('\n'):
                    if line.startswith("Suggested:"):
                        suggested = [c.strip().capitalize() for c in line.replace("Suggested:", "").split(',')]
                    elif line.startswith("Avoid:"):
                        avoid = [c.strip().capitalize() for c in line.replace("Avoid:", "").split(',')]
                    elif line.startswith("Tip:"):
                        tip = line.replace("Tip:", "").strip()
            except Exception as e:
                print("Failed to parse colors:", e)

        return {
            "primary": primary_color.capitalize(),
            "suggested_palette": suggested[:3],
            "avoid_colors": avoid[:3],
            "palette_name": style.capitalize() + " Harmony",
            "tip": tip,
        }
