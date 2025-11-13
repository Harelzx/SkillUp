# התקנת Playwright MCP לבדיקת האפליקציה ב-Web

Playwright MCP הותקן בהצלחה! כעת תוכל להשתמש בו כדי לבדוק את האפליקציה שלך בדפדפן.

## מה הותקן

1. **Playwright MCP Server** - שרת MCP שמאפשר שליטה בדפדפן דרך Claude
2. **דפדפנים** - Chromium, Firefox, ו-WebKit הותקנו עבור Playwright

## תצורה

התצורה נוספה לקובץ `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/playwright-mcp-server"
      ]
    }
  }
}
```

## שימוש

לאחר הפעלה מחדש של Cursor/Claude Desktop, תוכל לבקש:

- "פתח את האפליקציה בדפדפן בכתובת http://localhost:8081"
- "צלם צילום מסך של הדף"
- "לחץ על הכפתור 'התחבר'"
- "מלא את הטופס עם האימייל והסיסמה"
- "בדוק אם יש שגיאות בקונסול"

## דוגמאות פקודות

### פתיחת דף
```
פתח את האפליקציה ב-Chrome בכתובת http://localhost:8081
```

### צילום מסך
```
צלם צילום מסך של הדף הנוכחי
```

### אינטראקציה עם אלמנטים
```
לחץ על הכפתור עם הטקסט "התחבר"
מלא את שדה האימייל עם "test@example.com"
```

### בדיקת אלמנטים
```
מה הטקסט של הכותרת הראשית?
האם יש שגיאות בקונסול?
מה האלמנטים הנראים על המסך?
```

## הערות חשובות

1. **הפעלה מחדש נדרשת** - סגור ופתח מחדש את Cursor/Claude Desktop כדי שהתצורה תיטען
2. **האפליקציה חייבת לרוץ** - ודא שהאפליקציה רצה (למשל `npm run web`) לפני הבדיקה
3. **כתובת נכונה** - בדוק מה הכתובת שבה האפליקציה רצה (בדרך כלל `http://localhost:8081` עבור Expo)

## פתרון בעיות

אם Playwright MCP לא עובד:
1. ודא שהקובץ `.mcp.json` תקין (בדוק פסיקים וסוגריים)
2. הפעל מחדש את Cursor/Claude Desktop
3. בדוק את ה-console של Cursor לשגיאות
4. ודא שהדפדפנים הותקנו: `npx playwright install`

## מידע נוסף

- [Playwright MCP Documentation](https://www.mcp.bar/server/executeautomation/mcp-playwright)
- [Playwright Documentation](https://playwright.dev/)

