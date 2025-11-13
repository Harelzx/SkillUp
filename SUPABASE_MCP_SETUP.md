# התקנת Supabase MCP ב-Claude Code

התצורה של Supabase MCP נוספה לקובץ התצורה של Claude Desktop. כדי להשלים את ההתקנה, עליך למלא את הערכים הבאים:

## שלב 1: מציאת Project Ref

ה-Project Ref הוא מזהה הפרויקט שלך ב-Supabase. אתה יכול למצוא אותו בשתי דרכים:

### דרך 1: מה-URL של Supabase
ה-URL של Supabase שלך נראה כך: `https://<project-ref>.supabase.co`
ה-project-ref הוא החלק לפני `.supabase.co`

### דרך 2: מ-Dashboard של Supabase
1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-Settings > General
4. מצא את ה-Reference ID (זה ה-project-ref)

## שלב 2: יצירת Access Token

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. לחץ על האייקון של הפרופיל שלך (פינה ימנית עליונה)
3. בחר "Account Settings"
4. לך לטאב "Access Tokens"
5. לחץ על "Generate New Token"
6. תן שם לטוקן (למשל: "Claude MCP")
7. העתק את הטוקן שנוצר (תוכל לראות אותו רק פעם אחת!)

## שלב 3: עדכון קובץ התצורה

ערוך את הקובץ:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

החלף:
- `<YOUR_PROJECT_REF>` ב-project-ref שלך
- `<YOUR_ACCESS_TOKEN>` ב-access token שיצרת

דוגמה:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref",
        "abcdefghijklmnop"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## שלב 4: הפעלה מחדש

1. סגור את Claude Desktop לחלוטין
2. הפעל אותו מחדש
3. ה-MCP של Supabase אמור להיות פעיל כעת

## אימות ההתקנה

לאחר ההפעלה מחדש, תוכל לשאול את Claude שאלות על מסד הנתונים שלך, כמו:
- "מה הטבלאות שיש לי ב-Supabase?"
- "תראה לי את הסכמה של מסד הנתונים"
- "מה הנתונים בטבלת teachers?"

## הערות חשובות

- ה-Access Token הוא רגיש - אל תשתף אותו עם אחרים
- אם הטוקן נחשף, מחק אותו מ-Supabase Dashboard ויצור אחד חדש
- ה-MCP מוגדר כברירת מחדל כ-read-only, כך שהוא לא יכול לשנות נתונים

## פתרון בעיות

אם ה-MCP לא עובד:
1. ודא שהקובץ JSON תקין (בדוק פסיקים וסוגריים)
2. ודא שה-project-ref וה-access-token נכונים
3. בדוק את ה-console של Claude Desktop לשגיאות
4. ודא שיש לך חיבור לאינטרנט

