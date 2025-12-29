#!/usr/bin/env python3
"""
V2 Financial Data Consolidator
Cleans and standardizes V2 monthly financial CSV files into a master CSV.

V2 Format has richer data: Amount, Category, Mood, TimeOfDay, DayOfWeek, WeekNumber, Date

Usage:
  python consolidate_v2.py input.csv                    # Creates V2_master_finances-2026.csv
  python consolidate_v2.py input.csv --append           # Appends to existing master
  python consolidate_v2.py input.csv -o custom.csv      # Custom output file
"""

import csv
import sys
import argparse
from datetime import datetime
from pathlib import Path


# Valid values for validation
VALID_CATEGORIES = [
    "Cooking/Groceries",
    "Eating Out",
    "Transportation",
    "Projects",
    "Utilities",
    "Beauty/Grooming",
    "Clothing",
    "Travel/Adventure",
    "Other"
]

VALID_MOODS = [
    "Planned",
    "Impulse",
    "Social",
    "Necessary",
    "Treat",
    "Family"
]

VALID_TIME_OF_DAY = [
    "Morning",
    "Afternoon",
    "Evening",
    "Night"
]

VALID_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
]

# Normalization mappings (typos/variations → correct value)
CATEGORY_NORMALIZE = {
    "eating out": "Eating Out",
    "eAting out": "Eating Out",
    "EAting Out": "Eating Out",
    "cooking/groceries": "Cooking/Groceries",
    "Cooking/groceries": "Cooking/Groceries",
    "transportation": "Transportation",
    "projects": "Projects",
    "utilities": "Utilities",
    "beauty/grooming": "Beauty/Grooming",
    "clothing": "Clothing",
    "travel/adventure": "Travel/Adventure",
    "other": "Other",
}

MOOD_NORMALIZE = {
    "Impulsive": "Impulse",
    "impulsive": "Impulse",
    "impulse": "Impulse",
    "planned": "Planned",
    "social": "Social",
    "necessary": "Necessary",
    "treat": "Treat",
    "family": "Family",
}

TIME_OF_DAY_NORMALIZE = {
    "Late Night": "Night",
    "late night": "Night",
    "morning": "Morning",
    "afternoon": "Afternoon",
    "evening": "Evening",
    "night": "Night",
}


def normalize_value(value, mapping, valid_list):
    """Normalize a value using mapping, or return original if already valid."""
    if not value:
        return value
    
    # Already valid
    if value in valid_list:
        return value
    
    # Check mapping
    if value in mapping:
        return mapping[value]
    
    # Try case-insensitive match against valid list
    value_lower = value.lower()
    for valid in valid_list:
        if valid.lower() == value_lower:
            return valid
    
    # Return original (will fail validation)
    return value


def parse_date(date_str):
    """Parse date string to YYYY-MM-DD HH:MM:SS format (24hr military)."""
    date_str = date_str.strip()
    
    if not date_str:
        return None
    
    formats = [
        "%m/%d/%Y %H:%M:%S",  # 11/1/2025 13:06:12
        "%m/%d/%Y %H:%M",     # 11/1/2025 13:06
        "%m/%d/%Y",           # 11/1/2025
        "%Y-%m-%d %H:%M:%S",  # 2025-11-01 13:06:12
        "%Y-%m-%d",           # 2025-11-01
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
    
    return None


def extract_month_from_header(header_line):
    """Extract month from header like 'November 2025,,,,,,'"""
    clean = header_line.replace(",", "").strip()
    
    # Try "November 2025"
    try:
        dt = datetime.strptime(clean, "%B %Y")
        return dt.strftime("%b %Y")  # "Nov 2025"
    except ValueError:
        pass
    
    # Try "Nov 2025"
    try:
        dt = datetime.strptime(clean, "%b %Y")
        return dt.strftime("%b %Y")
    except ValueError:
        pass
    
    return clean


def validate_row(row_data, row_num):
    """
    Validate a row of data. Returns (is_valid, cleaned_data, error_reason).
    
    row_data: dict with keys: amount, category, mood, time_of_day, day_of_week, week_number, date
    """
    errors = []
    
    # Required fields check
    if not row_data.get('amount'):
        errors.append("missing amount")
    
    if not row_data.get('category'):
        errors.append("missing category")
    
    if not row_data.get('date'):
        errors.append("missing date")
    
    # Amount validation
    try:
        amount = float(row_data.get('amount', 0))
        if amount <= 0:
            errors.append(f"invalid amount: {row_data.get('amount')}")
    except (ValueError, TypeError):
        errors.append(f"invalid amount: {row_data.get('amount')}")
    
    # Normalize and validate category
    category = row_data.get('category', '').strip()
    category = normalize_value(category, CATEGORY_NORMALIZE, VALID_CATEGORIES)
    if category and category not in VALID_CATEGORIES:
        errors.append(f"invalid category: {row_data.get('category')}")
    
    # Normalize and validate mood (optional but if present, must be valid)
    mood = row_data.get('mood', '').strip()
    mood = normalize_value(mood, MOOD_NORMALIZE, VALID_MOODS)
    if mood and mood not in VALID_MOODS:
        errors.append(f"invalid mood: {row_data.get('mood')}")
    
    # Normalize and validate Time of Day (optional)
    time_of_day = row_data.get('time_of_day', '').strip()
    time_of_day = normalize_value(time_of_day, TIME_OF_DAY_NORMALIZE, VALID_TIME_OF_DAY)
    if time_of_day and time_of_day not in VALID_TIME_OF_DAY:
        errors.append(f"invalid time_of_day: {row_data.get('time_of_day')}")
    
    # Day of Week validation (optional)
    day_of_week = row_data.get('day_of_week', '').strip()
    if day_of_week and day_of_week not in VALID_DAYS:
        errors.append(f"invalid day_of_week: {day_of_week}")
    
    # Date parsing
    parsed_date = parse_date(row_data.get('date', ''))
    if row_data.get('date') and not parsed_date:
        errors.append(f"unparseable date: {row_data.get('date')}")
    
    if errors:
        return False, None, "; ".join(errors)
    
    # Return cleaned data (with normalized values)
    cleaned = {
        'date': parsed_date,
        'amount': str(amount),
        'category': category,
        'mood': mood,
        'time_of_day': time_of_day,
        'day_of_week': day_of_week,
        'week_number': row_data.get('week_number', '').strip()
    }
    
    return True, cleaned, None


def process_csv(input_file):
    """Process a V2 CSV file, return list of cleaned rows and dropped rows."""
    rows = []
    dropped = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    if len(lines) < 4:
        print(f"Error: File {input_file} has too few lines")
        return rows, dropped
    
    # Line 1: Month header
    month = extract_month_from_header(lines[0])
    
    # Line 2: Empty (skip)
    # Line 3: Column headers (skip)
    # Line 4+: Data
    
    # V2 column order: Amount, Category, Mood/Context, Time of Day, Day of Week, Week Number, Date
    for i, line in enumerate(lines[3:], start=4):
        line = line.strip()
        if not line:
            continue
        
        parts = line.split(",")
        
        if len(parts) < 7:
            dropped.append({
                'row': i,
                'content': line[:50] + "..." if len(line) > 50 else line,
                'reason': f"insufficient columns ({len(parts)}/7)"
            })
            continue
        
        row_data = {
            'amount': parts[0].strip(),
            'category': parts[1].strip(),
            'mood': parts[2].strip(),
            'time_of_day': parts[3].strip(),
            'day_of_week': parts[4].strip(),
            'week_number': parts[5].strip(),
            'date': parts[6].strip()
        }
        
        is_valid, cleaned, error = validate_row(row_data, i)
        
        if is_valid:
            rows.append({
                "Month": month,
                "Date": cleaned['date'],
                "Amount": cleaned['amount'],
                "Category": cleaned['category'],
                "Mood": cleaned['mood'],
                "TimeOfDay": cleaned['time_of_day'],
                "DayOfWeek": cleaned['day_of_week'],
                "WeekNumber": cleaned['week_number']
            })
        else:
            dropped.append({
                'row': i,
                'content': line[:50] + "..." if len(line) > 50 else line,
                'reason': error
            })
    
    return rows, dropped


def write_csv(rows, output_file, append=False):
    """Write rows to CSV file. Auto-replaces if month already exists."""
    fieldnames = ["Month", "Date", "Amount", "Category", "Mood", "TimeOfDay", "DayOfWeek", "WeekNumber"]
    file_exists = Path(output_file).exists()
    
    replaced_count = 0
    existing_rows = []
    
    # Get the month we're adding
    new_month = rows[0]["Month"] if rows else None
    
    # If appending and file exists, check for duplicates
    if append and file_exists and new_month:
        with open(output_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["Month"] == new_month:
                    replaced_count += 1
                else:
                    existing_rows.append(row)
        
        # If we found duplicates, rewrite the file without them
        if replaced_count > 0:
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(existing_rows)
    
    # Now append or create
    mode = 'a' if (append and file_exists) else 'w'
    write_header = not (append and file_exists)
    
    with open(output_file, mode, newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            writer.writeheader()
        writer.writerows(rows)
    
    return replaced_count


def print_report(rows, dropped, output_file, append, replaced_count=0):
    """Print summary report to user."""
    print("\n" + "=" * 50)
    print("V2 CONSOLIDATION REPORT")
    print("=" * 50)
    
    action = "Appended" if append else "Created"
    print(f"\n✓ {action} {len(rows)} rows → {output_file}")
    
    if replaced_count > 0:
        month = rows[0]["Month"] if rows else "Unknown"
        print(f"  ↳ Replaced {replaced_count} existing rows for {month}")
    
    if dropped:
        print(f"\n⚠ DROPPED {len(dropped)} rows:")
        print("-" * 50)
        for d in dropped:
            print(f"  Row {d['row']}: {d['reason']}")
            print(f"    Content: {d['content']}")
        print("-" * 50)
    else:
        print("\n✓ No rows dropped. All data valid.")
    
    print("\n" + "=" * 50)


def main():
    parser = argparse.ArgumentParser(description="Consolidate V2 financial CSV files")
    parser.add_argument("input", help="Input CSV file")
    parser.add_argument("-o", "--output", default="V2_master_finances-2026.csv", 
                        help="Output file (default: V2_master_finances-2026.csv)")
    parser.add_argument("--append", action="store_true", 
                        help="Append to existing output file (auto-replaces if month exists)")
    
    args = parser.parse_args()
    
    if not Path(args.input).exists():
        print(f"Error: Input file '{args.input}' not found")
        sys.exit(1)
    
    rows, dropped = process_csv(args.input)
    
    if not rows:
        print("No valid data processed")
        if dropped:
            print_report(rows, dropped, args.output, args.append)
        sys.exit(1)
    
    replaced_count = write_csv(rows, args.output, args.append)
    print_report(rows, dropped, args.output, args.append, replaced_count)


if __name__ == "__main__":
    main()