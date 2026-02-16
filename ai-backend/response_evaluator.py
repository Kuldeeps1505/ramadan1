"""
Response Quality Evaluator

Evaluates LLM responses based on quality criteria and triggers retries if needed.
"""

from typing import Dict, Any, Tuple, List
import re

class ResponseEvaluator:
    """Evaluates response quality based on content type"""
    
    def __init__(self):
        self.quality_thresholds = {
            "dua": 0.7,      # 70% minimum for duas
            "text": 0.6,     # 60% minimum for text responses
            "video": 0.5     # 50% minimum for videos
        }
    
    def evaluate_dua(self, dua: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Evaluate dua quality
        
        Criteria:
        - Has all required fields (20%)
        - Arabic text present and proper length (20%)
        - Transliteration present (15%)
        - Translation present and meaningful (15%)
        - Source is specific (15%)
        - Context is detailed (15%)
        
        Returns: (score, issues)
        """
        score = 0.0
        issues = []
        
        # Required fields check (20%)
        required_fields = ["arabic", "transliteration", "translation", "source", "context"]
        missing_fields = [f for f in required_fields if f not in dua or not dua[f]]
        
        if not missing_fields:
            score += 0.20
        else:
            issues.append(f"Missing fields: {', '.join(missing_fields)}")
        
        # Arabic text quality (20%)
        if "arabic" in dua and dua["arabic"]:
            arabic_text = dua["arabic"]
            # Check if it contains Arabic characters
            has_arabic = bool(re.search(r'[\u0600-\u06FF]', arabic_text))
            # Check length (should be at least 10 characters)
            proper_length = len(arabic_text) >= 10
            
            if has_arabic and proper_length:
                score += 0.20
            elif has_arabic:
                score += 0.10
                issues.append("Arabic text too short")
            else:
                issues.append("Arabic text missing or invalid")
        
        # Transliteration quality (15%)
        if "transliteration" in dua and dua["transliteration"]:
            trans = dua["transliteration"]
            # Should be at least 10 chars and contain only ASCII
            if len(trans) >= 10 and trans.isascii():
                score += 0.15
            else:
                score += 0.05
                issues.append("Transliteration too short or contains non-ASCII")
        
        # Translation quality (15%)
        if "translation" in dua and dua["translation"]:
            trans = dua["translation"]
            # Should be at least 15 words
            word_count = len(trans.split())
            if word_count >= 15:
                score += 0.15
            elif word_count >= 8:
                score += 0.10
                issues.append("Translation is brief")
            else:
                score += 0.05
                issues.append("Translation too short")
        
        # Source specificity (15%)
        if "source" in dua and dua["source"]:
            source = dua["source"]
            # Check if source is specific (contains numbers or specific reference)
            has_reference = bool(re.search(r'\d+', source)) or any(
                keyword in source.lower() 
                for keyword in ["quran", "hadith", "sahih", "sunan", "bukhari", "muslim"]
            )
            
            if has_reference and len(source) >= 8:
                score += 0.15
            elif has_reference:
                score += 0.10
                issues.append("Source could be more specific")
            else:
                score += 0.05
                issues.append("Source lacks specific reference")
        
        # Context quality (15%)
        if "context" in dua and dua["context"]:
            context = dua["context"]
            word_count = len(context.split())
            # Should explain when/why to use this dua
            if word_count >= 20:
                score += 0.15
            elif word_count >= 10:
                score += 0.10
                issues.append("Context could be more detailed")
            else:
                score += 0.05
                issues.append("Context too brief")
        
        return (score, issues)
    
    def evaluate_text_response(self, response: Dict[str, Any], query: str) -> Tuple[float, List[str]]:
        """
        Evaluate text response quality
        
        Criteria:
        - Has 'text' field (10%)
        - Appropriate length (20%)
        - Contains Islamic evidence/sources (20%)
        - Addresses the query (20%)
        - Well-structured (15%)
        - Actionable advice when appropriate (15%)
        
        Returns: (score, issues)
        """
        score = 0.0
        issues = []
        
        if "text" not in response or not response["text"]:
            return (0.0, ["No text content"])
        
        text = response["text"]
        score += 0.10  # Has text field
        
        # Length check (20%)
        word_count = len(text.split())
        char_count = len(text)
        
        if 100 <= word_count <= 400:  # Ideal range
            score += 0.20
        elif 50 <= word_count < 100:  # Too short but acceptable
            score += 0.15
            issues.append("Response is brief")
        elif word_count < 50:  # Too short
            score += 0.05
            issues.append("Response too short")
        elif word_count > 400:  # Too long
            score += 0.15
            issues.append("Response very long")
        
        # Islamic evidence (20%)
        has_evidence = any(
            keyword in text.lower()
            for keyword in [
                "quran", "hadith", "prophet", "pbuh", "allah", 
                "surah", "verse", "sahih", "sunnah", "narrated"
            ]
        )
        
        if has_evidence:
            # Check if specific citations
            has_citation = bool(re.search(r'\d+:\d+|\d+\.\d+', text))
            if has_citation:
                score += 0.20
            else:
                score += 0.15
                issues.append("Could include specific citations")
        else:
            score += 0.05
            issues.append("Lacks Islamic evidence/sources")
        
        # Query relevance (20%)
        # Check if key words from query appear in response
        query_words = set(query.lower().split())
        # Remove common words
        stop_words = {'what', 'is', 'the', 'how', 'can', 'i', 'a', 'an', 'in', 'on', 'to', 'for', 'of'}
        key_words = query_words - stop_words
        
        if key_words:
            text_lower = text.lower()
            relevance_count = sum(1 for word in key_words if word in text_lower)
            relevance_ratio = relevance_count / len(key_words)
            
            if relevance_ratio >= 0.6:
                score += 0.20
            elif relevance_ratio >= 0.3:
                score += 0.15
                issues.append("Could address query more directly")
            else:
                score += 0.05
                issues.append("May not fully address the query")
        else:
            score += 0.10  # Neutral if no key words
        
        # Structure (15%)
        # Check for paragraphs, greeting, closing
        has_greeting = any(
            greeting in text.lower()[:100]
            for greeting in ["assalamu", "salam", "dear brother", "dear sister"]
        )
        has_paragraphs = text.count('\n\n') >= 1 or char_count > 200
        
        if has_greeting and has_paragraphs:
            score += 0.15
        elif has_greeting or has_paragraphs:
            score += 0.10
        else:
            score += 0.05
            issues.append("Could improve structure (greeting/paragraphs)")
        
        # Actionable advice (15%)
        action_keywords = [
            "should", "can", "try", "practice", "recite", "perform", 
            "remember", "avoid", "make", "pray", "read"
        ]
        has_action = any(keyword in text.lower() for keyword in action_keywords)
        
        if has_action:
            score += 0.15
        else:
            score += 0.08
            # Not always needed, so just a note
        
        return (score, issues)
    
    def evaluate_videos(self, response: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Evaluate video recommendations quality
        
        Criteria:
        - Has videos array (20%)
        - Has 2-3 videos (20%)
        - Each video has required fields (20%)
        - Titles are specific (20%)
        - Channels are from approved list (20%)
        
        Returns: (score, issues)
        """
        score = 0.0
        issues = []
        
        if "videos" not in response:
            return (0.0, ["No videos field"])
        
        videos = response["videos"]
        
        if not videos:
            return (0.0, ["No videos returned"])
        
        score += 0.20  # Has videos array
        
        # Count check (20%)
        video_count = len(videos)
        if 2 <= video_count <= 3:
            score += 0.20
        elif video_count == 1:
            score += 0.10
            issues.append("Only 1 video returned")
        elif video_count > 3:
            score += 0.15
            issues.append("More than 3 videos")
        
        # Field completeness (20%)
        required_fields = ["title", "channel", "thumbnail", "duration"]
        complete_videos = 0
        
        for i, video in enumerate(videos):
            missing = [f for f in required_fields if f not in video or not video[f]]
            if not missing:
                complete_videos += 1
            else:
                issues.append(f"Video {i+1} missing: {', '.join(missing)}")
        
        if complete_videos == video_count:
            score += 0.20
        elif complete_videos >= video_count * 0.5:
            score += 0.10
        
        # Title specificity (20%)
        specific_titles = 0
        for video in videos:
            if "title" in video and video["title"]:
                title = video["title"]
                # Title should be at least 20 chars and not generic
                is_specific = len(title) >= 20 and title not in [
                    "Islamic Video", "Watch This", "Must Watch"
                ]
                if is_specific:
                    specific_titles += 1
        
        if specific_titles == video_count:
            score += 0.20
        elif specific_titles >= video_count * 0.5:
            score += 0.10
        else:
            issues.append("Titles are too generic")
        
        # Approved channels (20%)
        approved_channels = [
            "yaqeen institute", "bayyinah institute", "mufti menk",
            "omar suleiman", "nouman ali khan", "yasir qadhi"
        ]
        
        approved_count = 0
        for video in videos:
            if "channel" in video and video["channel"]:
                channel = video["channel"].lower()
                if any(approved in channel for approved in approved_channels):
                    approved_count += 1
        
        if approved_count == video_count:
            score += 0.20
        elif approved_count >= video_count * 0.5:
            score += 0.10
        else:
            issues.append("Some channels not from approved list")
        
        return (score, issues)
    
    def evaluate(self, response: Dict[str, Any], intent: str, query: str = "") -> Dict[str, Any]:
        """
        Main evaluation function
        
        Returns:
        {
            "score": float,
            "passed": bool,
            "issues": List[str],
            "recommendation": str
        }
        """
        if intent == "dua":
            score, issues = self.evaluate_dua(response)
            threshold = self.quality_thresholds["dua"]
        elif intent == "watch":
            score, issues = self.evaluate_videos(response)
            threshold = self.quality_thresholds["video"]
        else:  # ask_hafiz
            score, issues = self.evaluate_text_response(response, query)
            threshold = self.quality_thresholds["text"]
        
        passed = score >= threshold
        
        # Recommendation
        if passed:
            if score >= 0.9:
                recommendation = "Excellent quality"
            elif score >= 0.8:
                recommendation = "High quality"
            else:
                recommendation = "Acceptable quality"
        else:
            recommendation = "Quality below threshold - consider retry"
        
        return {
            "score": round(score, 2),
            "threshold": threshold,
            "passed": passed,
            "issues": issues,
            "recommendation": recommendation
        }


# Global evaluator instance
evaluator = ResponseEvaluator()