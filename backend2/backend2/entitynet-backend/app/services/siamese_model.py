import numpy as np
from fuzzywuzzy import fuzz

class SiameseMatcher:
    def __init__(self):
        pass
    
    def predict_similarity(self, text1, text2):
        # Use fuzzywuzzy as fallback
        similarity = fuzz.ratio(text1.lower(), text2.lower()) / 100.0
        
        # Boost if exact match
        if text1.lower() == text2.lower():
            similarity = 0.95
        
        # Boost if one contains other
        elif text1.lower() in text2.lower() or text2.lower() in text1.lower():
            similarity = min(similarity + 0.15, 0.90)
        
        return similarity