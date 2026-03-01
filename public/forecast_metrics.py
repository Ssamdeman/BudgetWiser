import csv
import json
import os
import sys
from datetime import datetime, date
from collections import defaultdict

def main():
    # Load the absolute path to the data
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "V2_master_finances-2026.csv")
    
    if not os.path.exists(csv_path):
        print(json.dumps({"error": "CSV not found"}))
        sys.exit(1)

    entries = []
    # Read the data manually without pandas to avoid dependency issues on the user's local machine
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                amount = float(row.get('Amount', 0.0))
                raw_date = row.get('Date', '')
                if not raw_date:
                    continue
                    
                # Date format is like 2026-01-02 06:50:48
                dt = datetime.strptime(raw_date.split()[0], "%Y-%m-%d").date()
                entries.append({
                    "month": row.get('Month', ''),
                    "date": dt,
                    "amount": round(amount, 2),
                    "category": row.get('Category', ''),
                    "mood": row.get('Mood', '')
                })
    except Exception as e:
        print(json.dumps({"error": f"Failed reading CSV: {str(e)}"}))
        sys.exit(1)

    if not entries:
        print(json.dumps({"error": "No entries parsed"}))
        sys.exit(0)

    # 1. Determine Current Month vs Past Months based strictly on the LATEST data available
    today = date.today()
    
    # Extract all distinct months present in the CSV
    unique_months = list(set([e['month'] for e in entries]))
    
    # Find the most recent month objectively
    def parse_month_str(m_str):
        try:
            return datetime.strptime(m_str, "%b %Y").date()
        except ValueError:
            return date.min
            
    latest_month_date = max(unique_months, key=parse_month_str)
    current_month_str = latest_month_date # already the exact string like "Feb 2026"
    
    past_entries = []
    current_entries = []
    
    # We want robust dynamic checking: if the entry month == LATEST month string, it's current. Else history.
    for e in entries:
        if e['month'] == current_month_str:
            current_entries.append(e)
        else:
            past_entries.append(e)

    # 2. Compute Top-Level Averages across PAST logic
    # Group past spending by Month entirely
    past_monthly_totals = defaultdict(float)
    for e in past_entries:
        past_monthly_totals[e['month']] += e['amount']

    average_monthly_spend = 0.0
    completed_months_count = len(past_monthly_totals)
    
    if completed_months_count > 0:
        average_monthly_spend = sum(past_monthly_totals.values()) / completed_months_count
        
    # Average daily spend across history
    # Assume roughly 30.4 days per month historically
    historical_daily_average = 0.0
    if average_monthly_spend > 0:
        historical_daily_average = average_monthly_spend / 30.4

    # 3. Compute Current Pace
    current_spend = sum(e['amount'] for e in current_entries)
    days_passed = today.day
    
    # Expected spending up to this point in a typical month
    expected_spend_by_now = historical_daily_average * days_passed
    pace_difference = current_spend - expected_spend_by_now
    
    # Positive pace_difference = OVERSPENDING
    # Negative pace_difference = UNDERSPENDING (Saving money!)

    # 4. Computed End-Of-Month Estimate
    # Total days in current month (rough estimate 30 unless it's explicitly computed)
    # Easiest way to get days in month in native Python without calendar module
    next_month = today.replace(day=28) + timedelta(days=4)
    last_day_of_month = next_month - timedelta(days=next_month.day)
    total_days_in_month = last_day_of_month.day
    
    days_remaining = total_days_in_month - days_passed
    
    # Re-evaluate daily pace for THIS month specifically
    current_daily_pace = current_spend / max(1, days_passed)
    
    end_of_month_estimate = current_spend + (current_daily_pace * days_remaining)

    # 5. Category Forecast (Top 3 Averages)
    past_category_totals = defaultdict(float)
    for e in past_entries:
        past_category_totals[e['category']] += e['amount']
        
    category_averages = []
    if completed_months_count > 0:
        for cat, total in past_category_totals.items():
            category_averages.append({
                "category": cat,
                "average": total / completed_months_count
            })
            
    # Sort by highest average
    category_averages = sorted(category_averages, key=lambda x: x['average'], reverse=True)[:3]

    # 6. Mood Pattern Dominance
    mood_counts = defaultdict(int)
    for e in past_entries:
        mood_counts[e['mood']] += 1
        
    total_past_moods = sum(mood_counts.values())
    top_mood = {"mood": "Unknown", "percentage": 0.0}
    
    if total_past_moods > 0:
        dominant_mood = max(mood_counts, key=mood_counts.get)
        percentage = (mood_counts[dominant_mood] / total_past_moods) * 100
        top_mood = {
            "mood": dominant_mood,
            "percentage": round(percentage, 1)
        }

    # Final Payload Assembly
    output_data = {
        "success": True,
        "historical_monthly_average": round(average_monthly_spend, 2),
        "current_spend": round(current_spend, 2),
        "expected_spend_by_now": round(expected_spend_by_now, 2),
        "pace_difference": round(pace_difference, 2),
        "is_overspending": pace_difference > 0,
        "end_of_month_estimate": round(end_of_month_estimate, 2),
        "category_forecasts": [{"category": c['category'], "average": round(c['average'], 2)} for c in category_averages],
        "top_mood": top_mood
    }

    print(json.dumps(output_data))

if __name__ == "__main__":
    from datetime import timedelta
    main()
