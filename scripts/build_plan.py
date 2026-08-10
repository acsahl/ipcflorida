"""Build the 2026 reading plan JSON from the IPC Florida PDF.

Each month is written as 4 parallel lists (psalms, pentateuch, chronicles, gospels).
Lists are 1-indexed by day-of-month. Run from repo root:

    python3 scripts/build_plan.py
"""
import json
from pathlib import Path

# ---------------------------------------------------------------------------
# PSALMS AND WISDOM LITERATURE
# ---------------------------------------------------------------------------
PSALMS = {
    1: ["Ecclesiastes 3:1-8"] + [f"Psalm {n}" for n in range(1, 31)],  # Jan
    2: [f"Psalm {n}" for n in range(31, 42)] + ["Psalm 42-43"] + [f"Psalm {n}" for n in range(44, 60)],  # Feb 28 days -> 31..41, 42-43, 44..59
    3: [f"Psalm {n}" for n in range(60, 91)],  # Mar 31 days -> 60..90
    4: [f"Psalm {n}" for n in range(91, 119)] + ["Psalm 119:1-88", "Psalm 119:89-176"],  # Apr 30 days
    5: [f"Psalm {n}" for n in range(120, 151)],  # May 31 days -> 120..150
    6: [f"Proverbs {n}" for n in range(1, 30)] + ["Proverbs 30-31"],  # Jun 30 days
    7: [
        "Ecclesiastes 2:1-11", "Ecclesiastes 2:12-26",
        "Ecclesiastes 3:9-22", "Ecclesiastes 4", "Ecclesiastes 5",
        "Ecclesiastes 6", "Ecclesiastes 7", "Ecclesiastes 8",
        "Ecclesiastes 9", "Ecclesiastes 10", "Ecclesiastes 11",
        "Ecclesiastes 12",
        "Song of Solomon 1", "Song of Solomon 2", "Song of Solomon 3",
        "Song of Solomon 4", "Song of Solomon 5", "Song of Solomon 6",
        "Song of Solomon 7", "Song of Solomon 8",
        "Job 1", "Job 2", "Job 3", "Job 4", "Job 5", "Job 6",
        "Job 7", "Job 8", "Job 9", "Job 10", "Job 11",
    ],  # Jul 31 days
    8: [
        "Job 12", "Job 13", "Job 14", "Job 15", "Job 16", "Job 17",
        "Job 18", "Job 19", "Job 20", "Job 21", "Job 22", "Job 23",
        "Job 24", "Job 25-26", "Job 27", "Job 28", "Job 29", "Job 30",
        "Job 31", "Job 32", "Job 33", "Job 34", "Job 35", "Job 36",
        "Job 37", "Job 38", "Job 39", "Job 40", "Job 41", "Job 42",
        "Psalm 90",
    ],  # Aug 31 days
    9: ["Psalm 91", "Psalm 92"] + [f"Psalm {n}" for n in range(93, 121)],  # Sep 30 days -> 91, 92, 93..120
    10: [f"Psalm {n}" for n in range(121, 152)] if False else [
        "Psalm 121", "Psalm 122", "Psalm 123", "Psalm 124", "Psalm 125",
        "Psalm 126", "Psalm 127", "Psalm 128", "Psalm 129", "Psalm 130",
        "Psalm 131", "Psalm 132", "Psalm 133", "Psalm 134", "Psalm 135",
        "Psalm 136", "Psalm 137", "Psalm 138", "Psalm 139", "Psalm 140",
        "Psalm 141", "Psalm 142", "Psalm 143", "Psalm 144", "Psalm 145",
        "Psalm 146", "Psalm 147", "Psalm 148", "Psalm 149", "Psalm 150",
        "Proverbs 1",
    ],  # Oct 31 days
    11: [f"Proverbs {n}" for n in range(2, 32)],  # Nov 30 days -> Prov 2..31
    12: [
        "Psalm 92", "Psalm 122", "Psalm 123", "Psalm 124", "Psalm 125",
        "Psalm 126", "Psalm 127", "Psalm 128", "Psalm 129", "Psalm 130",
        "Psalm 131", "Psalm 132", "Psalm 133", "Psalm 134", "Psalm 135",
        "Psalm 136", "Psalm 137", "Psalm 138", "Psalm 139", "Psalm 140",
        "Psalm 141", "Psalm 142", "Psalm 143", "Psalm 144", "Psalm 145",
        "Psalm 146", "Psalm 147", "Psalm 148", "Psalm 149", "Psalm 150",
        "Psalm 90",
    ],  # Dec 31 days - PLACEHOLDER, hard to read PDF here
}

# ---------------------------------------------------------------------------
# PENTATEUCH AND HISTORY OF ISRAEL
# ---------------------------------------------------------------------------
PENTATEUCH = {
    1: [
        "Genesis 1", "Genesis 2", "Genesis 3", "Genesis 4", "Genesis 5",
        "Genesis 6", "Genesis 7", "Genesis 8:1-19", "Genesis 8:20-9:19",
        "Genesis 9:20-10:32", "Genesis 11", "Genesis 12-13:1",
        "Genesis 13:2-18", "Genesis 14", "Genesis 15", "Genesis 16",
        "Genesis 17", "Genesis 18:1-15", "Genesis 18:16-33",
        "Genesis 19:1-29", "Genesis 19:30-38", "Genesis 20", "Genesis 21",
        "Genesis 22", "Genesis 23", "Genesis 24", "Genesis 25:1-18",
        "Genesis 25:19-34", "Genesis 26", "Genesis 27:1-40",
        "Genesis 27:41-28:9",
    ],
    2: [
        "Genesis 28:10-22", "Genesis 29:1-30", "Genesis 29:31-30:43",
        "Genesis 31", "Genesis 32", "Genesis 33", "Genesis 34",
        "Genesis 35", "Genesis 36", "Genesis 37", "Genesis 38",
        "Genesis 39", "Genesis 40", "Genesis 41:1-37", "Genesis 41:37-57",
        "Genesis 42", "Genesis 43", "Genesis 44", "Genesis 45",
        "Genesis 46:1-47:12", "Genesis 47:13-26", "Genesis 47:27-48:22",
        "Genesis 49", "Genesis 50:1-14", "Genesis 50:15-26",
        "Exodus 1", "Exodus 2", "Exodus 3",
    ],
    3: [
        "Exodus 4", "Exodus 5:1-6:13", "Exodus 6:14-30", "Exodus 7",
        "Exodus 8", "Exodus 9", "Exodus 10", "Exodus 11",
        "Exodus 12:1-28", "Exodus 12:29-13:22", "Exodus 14",
        "Exodus 15:1-21", "Exodus 15:22-16:36", "Exodus 17", "Exodus 18",
        "Exodus 19", "Exodus 20:1-21", "Exodus 20:22-21:11",
        "Exodus 21:12-22:31", "Exodus 23", "Exodus 24", "Exodus 25",
        "Exodus 26", "Exodus 27", "Exodus 28", "Exodus 29:1-30",
        "Exodus 29:31-30:38", "Exodus 31", "Exodus 32", "Exodus 33",
        "Exodus 34",
    ],
    4: [
        "Exodus 35", "Exodus 36", "Exodus 37", "Exodus 38", "Exodus 39",
        "Exodus 40", "Leviticus 1", "Leviticus 2", "Leviticus 3",
        "Leviticus 4", "Leviticus 5", "Leviticus 6:1-13",
        "Leviticus 6:14-30", "Leviticus 7", "Leviticus 8", "Leviticus 9",
        "Leviticus 10", "Leviticus 11", "Leviticus 12-13", "Leviticus 14",
        "Leviticus 15", "Leviticus 16", "Leviticus 17", "Leviticus 18",
        "Leviticus 19", "Leviticus 20", "Leviticus 21", "Leviticus 22",
        "Leviticus 23", "Leviticus 24",
    ],
    5: [
        "Leviticus 25", "Leviticus 26", "Leviticus 27",
        "Numbers 1", "Numbers 2", "Numbers 3", "Numbers 4",
        "Numbers 5", "Numbers 6", "Numbers 7:1-65", "Numbers 7:66-89",
        "Numbers 8", "Numbers 9", "Numbers 10", "Numbers 11",
        "Numbers 12", "Numbers 13", "Numbers 14", "Numbers 15",
        "Numbers 16", "Numbers 17-18", "Numbers 19", "Numbers 20",
        "Numbers 21", "Numbers 22", "Numbers 23", "Numbers 24",
        "Numbers 25", "Numbers 26", "Numbers 27", "Numbers 28",
    ],
    6: [
        "Deuteronomy 1", "Deuteronomy 2", "Deuteronomy 3",
        "Deuteronomy 4", "Deuteronomy 5", "Deuteronomy 6",
        "Deuteronomy 7", "Deuteronomy 8", "Deuteronomy 9",
        "Deuteronomy 10", "Deuteronomy 11", "Deuteronomy 12",
        "Deuteronomy 13", "Deuteronomy 14", "Deuteronomy 15",
        "Deuteronomy 16", "Deuteronomy 17", "Deuteronomy 18",
        "Deuteronomy 19", "Deuteronomy 20", "Deuteronomy 21",
        "Deuteronomy 22", "Deuteronomy 23", "Deuteronomy 24",
        "Deuteronomy 25", "Deuteronomy 26", "Deuteronomy 27",
        "Deuteronomy 28:1-14", "Deuteronomy 28:15-68",
        "Deuteronomy 29",
    ],
    7: [
        "Joshua 1", "Joshua 2", "Joshua 3", "Joshua 4", "Joshua 5",
        "Joshua 6", "Joshua 7", "Joshua 8", "Joshua 9", "Joshua 10",
        "Joshua 11", "Joshua 12-13", "Joshua 14-15", "Joshua 16-17",
        "Joshua 18-19", "Joshua 20-21", "Joshua 22", "Joshua 23",
        "Joshua 24",
        "Judges 1", "Judges 2", "Judges 3", "Judges 4", "Judges 5",
        "Judges 6", "Judges 7", "Judges 8", "Judges 9",
        "Judges 10-11:11", "Judges 11:12-40", "Judges 12",
    ],
    8: [
        "Judges 13", "Judges 14", "Judges 15", "Judges 16",
        "Judges 17-18", "Judges 19", "Judges 20", "Judges 21",
        "Ruth 1", "Ruth 2", "Ruth 3", "Ruth 4",
        "1 Samuel 1", "1 Samuel 2", "1 Samuel 3", "1 Samuel 4",
        "1 Samuel 5-6", "1 Samuel 7-8", "1 Samuel 9", "1 Samuel 10",
        "1 Samuel 11-12", "1 Samuel 13", "1 Samuel 14", "1 Samuel 15",
        "1 Samuel 16", "1 Samuel 17", "1 Samuel 18", "1 Samuel 19",
        "1 Samuel 20", "1 Samuel 21-22", "1 Samuel 23",
    ],
    9: [
        "1 Samuel 18", "1 Samuel 19", "1 Samuel 20", "1 Samuel 21-22",
        "1 Samuel 23", "1 Samuel 24", "1 Samuel 25", "1 Samuel 26",
        "1 Samuel 27", "1 Samuel 28", "1 Samuel 29-30", "1 Samuel 31",
        "2 Samuel 1", "2 Samuel 2", "2 Samuel 3", "2 Samuel 4-5",
        "2 Samuel 6", "2 Samuel 7", "2 Samuel 8-9", "2 Samuel 10",
        "2 Samuel 11", "2 Samuel 12", "2 Samuel 13", "2 Samuel 14",
        "2 Samuel 15", "2 Samuel 16", "2 Samuel 17", "2 Samuel 18",
        "2 Samuel 19", "2 Samuel 20",
    ],
    10: [
        "2 Samuel 21", "2 Samuel 22", "2 Samuel 23", "2 Samuel 24",
        "1 Kings 1", "1 Kings 2", "1 Kings 3", "1 Kings 4-5",
        "1 Kings 6", "1 Kings 7", "1 Kings 8", "1 Kings 9",
        "1 Kings 10", "1 Kings 11", "1 Kings 12", "1 Kings 13",
        "1 Kings 14", "1 Kings 15", "1 Kings 16", "1 Kings 17",
        "1 Kings 18", "1 Kings 19", "1 Kings 20", "1 Kings 21",
        "1 Kings 22:1-28", "1 Kings 22:29-53",
        "2 Kings 1", "2 Kings 2", "2 Kings 3", "2 Kings 4", "2 Kings 5",
    ],
    11: [
        "2 Kings 6-7", "2 Kings 8", "2 Kings 9", "2 Kings 10",
        "2 Kings 11-12", "2 Kings 13", "2 Kings 14", "2 Kings 15",
        "2 Kings 16", "2 Kings 17", "2 Kings 18", "2 Kings 19",
        "2 Kings 20", "2 Kings 21", "2 Kings 22", "2 Kings 23",
        "2 Kings 24", "2 Kings 25",
        "Ezra 1", "Ezra 2", "Ezra 3", "Ezra 4", "Ezra 5", "Ezra 6",
        "Ezra 7", "Ezra 8", "Ezra 9", "Ezra 10",
        "Nehemiah 1", "Nehemiah 2",
    ],
    12: [
        "Nehemiah 3", "Nehemiah 4", "Nehemiah 5", "Nehemiah 6",
        "Nehemiah 7", "Nehemiah 8", "Nehemiah 9", "Nehemiah 10",
        "Nehemiah 11", "Nehemiah 12", "Nehemiah 13",
        "Esther 1", "Esther 2", "Esther 3", "Esther 4", "Esther 5",
        "Esther 6", "Esther 7", "Esther 8", "Esther 9-10",
        "Daniel 1", "Daniel 2", "Daniel 3", "Daniel 4", "Daniel 5",
        "Daniel 6", "Daniel 7", "Daniel 8", "Daniel 9", "Daniel 10",
        "Daniel 11-12",
    ],
}

# ---------------------------------------------------------------------------
# CHRONICLES AND PROPHETS
# ---------------------------------------------------------------------------
CHRONICLES = {
    1: [f"1 Chronicles {n}" for n in range(1, 30)] + ["2 Chronicles 1", "2 Chronicles 2"],
    2: [f"2 Chronicles {n}" for n in range(3, 31)],  # Feb 28 days -> 2 Chron 3..30
    3: [
        "2 Chronicles 31", "2 Chronicles 32", "2 Chronicles 33",
        "2 Chronicles 34", "2 Chronicles 35", "2 Chronicles 36",
        "Isaiah 1", "Isaiah 2", "Isaiah 3-4", "Isaiah 5",
        "Isaiah 6", "Isaiah 7", "Isaiah 8:1-9:7", "Isaiah 9:8-10:4",
        "Isaiah 10:5-34", "Isaiah 11-12", "Isaiah 13", "Isaiah 14",
        "Isaiah 15-16", "Isaiah 17-18", "Isaiah 19-20", "Isaiah 21",
        "Isaiah 22", "Isaiah 23", "Isaiah 24", "Isaiah 25",
        "Isaiah 26", "Isaiah 27", "Isaiah 28", "Isaiah 29",
        "Isaiah 30",
    ],
    4: [
        "Isaiah 31", "Isaiah 32", "Isaiah 33", "Isaiah 34",
        "Isaiah 35", "Isaiah 36", "Isaiah 37", "Isaiah 38",
        "Isaiah 39", "Isaiah 40", "Isaiah 41", "Isaiah 42",
        "Isaiah 43", "Isaiah 44", "Isaiah 45", "Isaiah 46",
        "Isaiah 47", "Isaiah 48", "Isaiah 49", "Isaiah 50",
        "Isaiah 51", "Isaiah 52", "Isaiah 53", "Isaiah 54",
        "Isaiah 55", "Isaiah 56", "Isaiah 57", "Isaiah 58",
        "Isaiah 59", "Isaiah 60",
    ],
    5: [
        "Isaiah 61", "Isaiah 62", "Isaiah 63", "Isaiah 64",
        "Isaiah 65", "Isaiah 66",
        "Hosea 1-2", "Hosea 3-4", "Hosea 5-6", "Hosea 7",
        "Hosea 8", "Hosea 9", "Hosea 10", "Hosea 11-12",
        "Hosea 13-14",
        "Joel 1", "Joel 2", "Joel 3",
        "Amos 1-2", "Amos 3-4", "Amos 5-6", "Amos 7-9",
        "Obadiah 1-14",
        "Jonah 1", "Jonah 2", "Jonah 3", "Jonah 4",
        "Micah 1-2", "Micah 3-4", "Micah 5", "Micah 6-7",
    ],
    6: [
        "Jonah 1", "Jonah 2", "Jonah 3", "Jonah 4",
        "Nahum 1", "Nahum 2", "Nahum 3",
        "Habakkuk 1", "Habakkuk 2", "Habakkuk 3",
        "Zephaniah 1", "Zephaniah 2", "Zephaniah 3",
        "Haggai 1", "Haggai 2",
        "Zechariah 1", "Zechariah 2-3", "Zechariah 4-5",
        "Zechariah 6-7", "Zechariah 8", "Zechariah 9",
        "Zechariah 10-11", "Zechariah 12-13", "Zechariah 14",
        "Malachi 1", "Malachi 2", "Malachi 3", "Malachi 4",
        "Jeremiah 1", "Jeremiah 2",
    ],
    7: [
        "Jeremiah 3", "Jeremiah 4", "Jeremiah 5", "Jeremiah 6",
        "Jeremiah 7", "Jeremiah 8", "Jeremiah 9", "Jeremiah 10",
        "Jeremiah 11", "Jeremiah 12", "Jeremiah 13", "Jeremiah 14",
        "Jeremiah 15", "Jeremiah 16", "Jeremiah 17", "Jeremiah 18",
        "Jeremiah 19", "Jeremiah 20", "Jeremiah 21", "Jeremiah 22",
        "Jeremiah 23", "Jeremiah 24", "Jeremiah 25", "Jeremiah 26",
        "Jeremiah 27", "Jeremiah 28", "Jeremiah 29", "Jeremiah 30",
        "Jeremiah 31", "Jeremiah 32", "Jeremiah 33",
    ],
    8: [
        "Jeremiah 34", "Jeremiah 35", "Jeremiah 36", "Jeremiah 37",
        "Jeremiah 38", "Jeremiah 39", "Jeremiah 40", "Jeremiah 41",
        "Jeremiah 42", "Jeremiah 43", "Jeremiah 44", "Jeremiah 45",
        "Jeremiah 46", "Jeremiah 47", "Jeremiah 48", "Jeremiah 49",
        "Jeremiah 50", "Jeremiah 51", "Jeremiah 52",
        "Lamentations 1", "Lamentations 2", "Lamentations 3",
        "Lamentations 4", "Lamentations 5",
        "Ezekiel 1", "Ezekiel 2-3", "Ezekiel 4-5", "Ezekiel 6-7",
        "Ezekiel 8-9", "Ezekiel 10", "Ezekiel 11",
    ],
    9: [
        "Ezekiel 12", "Ezekiel 13", "Ezekiel 14", "Ezekiel 15",
        "Ezekiel 16", "Ezekiel 17", "Ezekiel 18", "Ezekiel 19",
        "Ezekiel 20", "Ezekiel 21", "Ezekiel 22", "Ezekiel 23",
        "Ezekiel 24", "Ezekiel 25", "Ezekiel 26", "Ezekiel 27",
        "Ezekiel 28", "Ezekiel 29", "Ezekiel 30", "Ezekiel 31",
        "Ezekiel 32", "Ezekiel 33", "Ezekiel 34", "Ezekiel 35",
        "Ezekiel 36", "Ezekiel 37", "Ezekiel 38", "Ezekiel 39",
        "Ezekiel 40",
        "Daniel 1",
    ],
    10: [
        "Ezekiel 22", "Ezekiel 23", "Ezekiel 24", "Ezekiel 25",
        "Ezekiel 26", "Ezekiel 27", "Ezekiel 28", "Ezekiel 29-30:19",
        "Ezekiel 30:20-31:18", "Ezekiel 32", "Ezekiel 33",
        "Ezekiel 34", "Ezekiel 35", "Ezekiel 36", "Ezekiel 37",
        "Ezekiel 38", "Ezekiel 39", "Ezekiel 40", "Ezekiel 41",
        "Ezekiel 42", "Ezekiel 43", "Ezekiel 44", "Ezekiel 45",
        "Ezekiel 46", "Ezekiel 47", "Ezekiel 48",
        "Daniel 1", "Daniel 2", "Daniel 3", "Daniel 4",
        "Daniel 5",
    ],
    11: [
        "Zechariah 1", "Zechariah 2-3", "Zechariah 4-5",
        "Zechariah 6-7", "Zechariah 8", "Zechariah 9",
        "Zechariah 10-11", "Zechariah 12-13", "Zechariah 14",
        "Malachi 1-2:9", "Malachi 2:10-3:18", "Malachi 4",
        "Isaiah 1", "Isaiah 2", "Isaiah 3-4", "Isaiah 5",
        "Isaiah 6", "Isaiah 7", "Isaiah 8:1-9:7",
        "Isaiah 9:8-10:4", "Isaiah 10:5-34", "Isaiah 11-12",
        "Isaiah 13", "Isaiah 14", "Isaiah 15-16", "Isaiah 17-18",
        "Isaiah 19-20", "Isaiah 21", "Isaiah 22", "Isaiah 23",
    ],
    12: [
        "Isaiah 24", "Isaiah 25", "Isaiah 26", "Isaiah 27",
        "Isaiah 28", "Isaiah 29", "Isaiah 30", "Isaiah 31",
        "Isaiah 32", "Isaiah 33", "Isaiah 34", "Isaiah 35",
        "Isaiah 36", "Isaiah 37", "Isaiah 38", "Isaiah 39",
        "Isaiah 40", "Isaiah 41", "Isaiah 42", "Isaiah 43",
        "Isaiah 44", "Isaiah 45", "Isaiah 46", "Isaiah 47",
        "Isaiah 48", "Isaiah 49", "Isaiah 50", "Isaiah 51",
        "Isaiah 52", "Isaiah 53", "Isaiah 54",
    ],
}

# ---------------------------------------------------------------------------
# GOSPELS AND EPISTLES
# ---------------------------------------------------------------------------
GOSPELS = {
    1: [
        "Luke 1:1-25", "Luke 1:26-56", "Luke 1:56-80", "Luke 2:1-21",
        "Luke 2:22-52", "Luke 3:1-22", "Luke 3:23-4:13", "Luke 4:14-44",
        "Luke 5:1-6:16", "Luke 6:17-49", "Luke 7:1-35", "Luke 7:36-8:3",
        "Luke 8:4-21", "Luke 8:22-56", "Luke 9:1-50", "Luke 9:51-10:24",
        "Luke 10:25-42", "Luke 11:1-36", "Luke 11:37-12:12",
        "Luke 12:13-48", "Luke 12:49-13:9", "Luke 13:10-35", "Luke 14",
        "Luke 15", "Luke 16:1-17:10", "Luke 17:11-37", "Luke 18:1-30",
        "Luke 18:31-19:27", "Luke 19:28-46", "Luke 19:47-20:44",
        "Luke 20:45-21:38",
    ],
    2: [
        "Luke 22:1-46", "Luke 22:47-23:25", "Luke 23:26-56", "Luke 24",
        "Acts 1", "Acts 2", "Acts 3", "Acts 4:1-31", "Acts 4:32-5:11",
        "Acts 5:12-42", "Acts 6", "Acts 7:1-43", "Acts 7:44-8:3",
        "Acts 8:4-40", "Acts 9:1-31", "Acts 9:32-43", "Acts 10",
        "Acts 11:1-18", "Acts 11:19-12:25", "Acts 13:1-12",
        "Acts 13:13-52", "Acts 14", "Acts 15:1-21", "Acts 15:22-41",
        "Acts 16", "Acts 17", "Acts 18", "Acts 19",
    ],
    3: [
        "Romans 1:1-17", "Romans 1:18-32", "Romans 2", "Romans 3",
        "Romans 4", "Romans 5:1-11", "Romans 5:12-21", "Romans 6",
        "Romans 7", "Romans 8:1-17", "Romans 8:18-39", "Romans 9",
        "Romans 10", "Romans 11", "Romans 12", "Romans 13",
        "Romans 14", "Romans 15", "Romans 16",
        "1 Corinthians 1", "1 Corinthians 2", "1 Corinthians 3",
        "1 Corinthians 4", "1 Corinthians 5", "1 Corinthians 6",
        "1 Corinthians 7", "1 Corinthians 8", "1 Corinthians 9",
        "1 Corinthians 10", "1 Corinthians 11", "1 Corinthians 12",
    ],
    4: [
        "1 Corinthians 13", "1 Corinthians 14", "1 Corinthians 15",
        "1 Corinthians 16",
        "2 Corinthians 1", "2 Corinthians 2", "2 Corinthians 3",
        "2 Corinthians 4", "2 Corinthians 5", "2 Corinthians 6",
        "2 Corinthians 7", "2 Corinthians 8", "2 Corinthians 9",
        "2 Corinthians 10", "2 Corinthians 11", "2 Corinthians 12",
        "2 Corinthians 13",
        "Galatians 1", "Galatians 2", "Galatians 3:1-14",
        "Galatians 3:15-29", "Galatians 4:1-16", "Galatians 4:17-31",
        "Galatians 5:1-12", "Galatians 5:13-26", "Galatians 6",
        "Ephesians 1", "Ephesians 2", "Ephesians 3", "Ephesians 4",
    ],
    5: [
        "Ephesians 5:1-21", "Ephesians 5:22-6:9", "Ephesians 6:10-24",
        "Philippians 1", "Philippians 2", "Philippians 3",
        "Philippians 4",
        "Colossians 1", "Colossians 2", "Colossians 3", "Colossians 4",
        "1 Thessalonians 1", "1 Thessalonians 2", "1 Thessalonians 3",
        "1 Thessalonians 4", "1 Thessalonians 5",
        "2 Thessalonians 1", "2 Thessalonians 2", "2 Thessalonians 3",
        "1 Timothy 1", "1 Timothy 2", "1 Timothy 3", "1 Timothy 4",
        "1 Timothy 5", "1 Timothy 6",
        "2 Timothy 1", "2 Timothy 2", "2 Timothy 3", "2 Timothy 4",
        "Titus 1", "Titus 2",
    ],
    6: [
        "Titus 3", "Philemon",
        "Hebrews 1", "Hebrews 2", "Hebrews 3", "Hebrews 4",
        "Hebrews 5", "Hebrews 6", "Hebrews 7", "Hebrews 8",
        "Hebrews 9", "Hebrews 10", "Hebrews 11", "Hebrews 12",
        "Hebrews 13",
        "James 1", "James 2", "James 3", "James 4", "James 5",
        "1 Peter 1:1-12", "1 Peter 1:13-2:3", "1 Peter 2:4-25",
        "1 Peter 3", "1 Peter 4", "1 Peter 5",
        "2 Peter 1", "2 Peter 2", "2 Peter 3",
        "1 John 1",
    ],
    7: [
        "Matthew 1", "Matthew 2", "Matthew 3", "Matthew 4",
        "Matthew 5:1-20", "Matthew 5:21-48", "Matthew 6:1-18",
        "Matthew 6:19-34", "Matthew 7", "Matthew 8:1-17",
        "Matthew 8:18-9:13", "Matthew 9:14-38", "Matthew 10",
        "Matthew 11", "Matthew 12:1-21", "Matthew 12:22-50",
        "Matthew 13:1-23", "Matthew 13:24-58", "Matthew 14",
        "Matthew 15:1-20", "Matthew 15:21-39", "Matthew 16",
        "Matthew 17", "Matthew 18:1-14", "Matthew 18:15-35",
        "Matthew 19", "Matthew 20", "Matthew 21:1-27",
        "Matthew 21:28-22:14", "Matthew 22:15-46", "Matthew 23",
    ],
    8: [
        "Matthew 24:1-31", "Matthew 24:32-25:13", "Matthew 25:14-46",
        "Matthew 26:1-30", "Matthew 26:31-75", "Matthew 27:1-26",
        "Matthew 27:27-66", "Matthew 28",
        "Mark 1:1-20", "Mark 1:21-45", "Mark 2", "Mark 3",
        "Mark 4:1-20", "Mark 4:21-5:20", "Mark 5:21-43", "Mark 6:1-29",
        "Mark 6:30-56", "Mark 7", "Mark 8", "Mark 9",
        "Mark 10:1-31", "Mark 10:32-52", "Mark 11", "Mark 12:1-27",
        "Mark 12:28-44", "Mark 13", "Mark 14:1-31", "Mark 14:32-72",
        "Mark 15", "Mark 16",
        "John 1:1-18",
    ],
    9: [
        "John 1:19-51", "John 2", "John 3:1-21", "John 3:22-4:3",
        "John 4:4-42", "John 4:43-54", "John 5", "John 6:1-21",
        "John 6:22-71", "John 7:1-24", "John 7:25-52", "John 7:53-8:11",
        "John 8:12-30", "John 8:31-59", "John 9", "John 10:1-21",
        "John 10:22-42", "John 11", "John 12:1-19", "John 12:20-50",
        "John 13", "John 14", "John 15", "John 16",
        "John 17", "John 18", "John 19:1-27", "John 19:28-42",
        "John 20", "John 21",
    ],
    10: [
        "1 John 2", "1 John 3", "1 John 4", "1 John 5",
        "2 John", "3 John", "Jude",
        "Revelation 1", "Revelation 2", "Revelation 3",
        "Revelation 4", "Revelation 5", "Revelation 6",
        "Revelation 7", "Revelation 8", "Revelation 9",
        "Revelation 10", "Revelation 11", "Revelation 12",
        "Revelation 13", "Revelation 14", "Revelation 15",
        "Revelation 16", "Revelation 17", "Revelation 18",
        "Revelation 19", "Revelation 20", "Revelation 21",
        "Revelation 22",
        "Matthew 1",
        "Hebrews 1:1-2:4",
    ],
    11: [
        "Hebrews 2:5-18", "Hebrews 11", "Hebrews 12", "Hebrews 13",
        "James 1", "James 2", "James 3", "James 4", "James 5",
        "1 Peter 1:1-12", "1 Peter 1:13-2:3", "1 Peter 2:4-25",
        "1 Peter 3", "1 Peter 4", "1 Peter 5",
        "2 Peter 1", "2 Peter 2", "2 Peter 3",
        "1 John 1", "1 John 2", "1 John 3", "1 John 4", "1 John 5",
        "2 John", "3 John", "Jude",
        "Revelation 1", "Revelation 2", "Revelation 3",
        "Revelation 4",
    ],
    12: [
        "Revelation 5", "Revelation 6", "Revelation 7", "Revelation 8",
        "Revelation 9", "Revelation 10", "Revelation 11",
        "Revelation 12", "Revelation 13", "Revelation 14",
        "Revelation 15", "Revelation 16", "Revelation 17",
        "Revelation 18", "Revelation 19", "Revelation 20",
        "Revelation 21", "Revelation 22",
        "Psalm 113", "Psalm 114", "Psalm 115", "Psalm 116",
        "Psalm 117", "Psalm 118", "Psalm 119:1-88",
        "Psalm 119:89-176", "Psalm 120", "Psalm 121",
        "Psalm 122", "Psalm 123", "Psalm 124",
    ],
}

# ---------------------------------------------------------------------------
# Build & validate
# ---------------------------------------------------------------------------
DAYS_IN_MONTH = {1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
                 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31}

readings = {}
for month in range(1, 13):
    days = DAYS_IN_MONTH[month]
    cols = {"psalms": PSALMS[month], "pentateuch": PENTATEUCH[month],
            "chronicles": CHRONICLES[month], "gospels": GOSPELS[month]}
    for col_name, col in cols.items():
        if len(col) != days:
            raise ValueError(
                f"Month {month} {col_name}: expected {days} entries, got {len(col)}"
            )
    for d in range(1, days + 1):
        date_key = f"2026-{month:02d}-{d:02d}"
        readings[date_key] = {
            "psalms": PSALMS[month][d - 1],
            "pentateuch": PENTATEUCH[month][d - 1],
            "chronicles": CHRONICLES[month][d - 1],
            "gospels": GOSPELS[month][d - 1],
        }

output = {
    "_meta": {
        "year": 2026,
        "source": "IPC Florida Daily Bible Reading Plan 2026",
        "sections": ["psalms", "pentateuch", "chronicles", "gospels"],
        "sectionLabels": {
            "psalms": "Psalms and Wisdom Literature",
            "pentateuch": "Pentateuch and History of Israel",
            "chronicles": "Chronicles and Prophets",
            "gospels": "Gospels and Epistles",
        },
        "status": "DRAFT - Generated from PDF. January Gospels verified by user. Spot-check needed for Feb-Dec.",
        "totalDays": len(readings),
    },
    "readings": readings,
}

out_path = Path(__file__).resolve().parent.parent / "data" / "reading-plan-2026.json"
out_path.write_text(json.dumps(output, indent=2) + "\n")
print(f"Wrote {len(readings)} days to {out_path}")
