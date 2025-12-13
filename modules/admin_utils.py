# import pandas as pd # Removed for size optimization
import streamlit as st
import random
from datetime import datetime, timedelta

def fetch_rss_feeds(urls):
    """
    Fetches and parses RSS feeds from a list of URLs.
    """
    feed_items = []
    
    for url in urls:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            feed_items.append({
                "title": entry.title,
                "link": entry.link,
                "published": entry.get("published", "No Date"),
                "summary": entry.get("summary", "No Summary")
            })
            
    return feed_items

def summarize_text(text):
    """
    Mockup for AI Text Summarization.
    Real implementation would use an LLM API.
    """
    if len(text) > 100:
        return text[:100] + "..."
    return text

def plot_user_stats(history_data=None):
    """
    Visualizes user statistics using Streamlit native charts (no Pandas).
    """
    # Mock data for demonstration if history_data is not provided
    if history_data is None:
        # Create mock data using list of dicts or just dict of lists
        # Streamlit works fine with dict of lists
        
        dates = [(datetime(2025, 12, 1) + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(10)]
        xp_gained = [50, 60, 40, 80, 100, 90, 120, 110, 150, 130]
        words_learned = [5, 6, 4, 8, 10, 9, 12, 11, 15, 13]
        
        data = {
            "date": dates,
            "XP Gained": xp_gained,
            "Words Learned": words_learned
        }
        
        # Streamlit line_chart can take a dict, but usually expects index as part of data or index
        # To mimic setting index to date without pandas, we can structure it differently or just pass chart data.
        # Actually, st.line_chart(data) treats keys as series. 
        # If we want 'date' to be x-axis, we might need a slightly different format or just use the indices.
        # For simplicity to avoid pandas, let's just chart the values.
        
        st.subheader("Daily Activity (XP)")
        st.line_chart(xp_gained)
    else:
        # Implement with real history data if available
        pass
    else:
        # Implement with real history data if available
        pass
