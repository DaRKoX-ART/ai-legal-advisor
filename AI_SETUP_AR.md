# تشغيل OpenRouter AI في التطبيق

هذا المشروع تطبيق هاتف Expo / React Native. لا تضع مفتاح OpenRouter داخل التطبيق نفسه، لأن أي شخص يستطيع استخراج المفتاح من ملف APK أو من نسخة الويب. المفتاح يجب أن يبقى داخل السيرفر فقط.

## 1. جهز مفتاح OpenRouter

1. افتح OpenRouter:
   https://openrouter.ai/keys
2. أنشئ API key جديد.
3. انسخ `.env.example` إلى `.env`.
4. ضع المفتاح:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=openai/gpt-oss-20b:free
```

السيرفر يقرأ ملف `.env` تلقائياً عند التشغيل.

## استخدام Gemini بدل OpenRouter

إذا أردت استخدام Gemini، غيّر الإعدادات في `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

موديلات OpenRouter المجانية تتغير، لذلك إذا ظهر خطأ أن الموديل غير متاح، اختر موديل آخر ينتهي بـ `:free` من:
https://openrouter.ai/models?max_price=0

## 2. شغل سيرفر الذكاء الاصطناعي

من داخل مجلد المشروع:

```powershell
$env:PORT="3000"
node server\serve.js
```

افحص السيرفر:

```powershell
curl -Method POST http://localhost:3000/api/chat `
  -ContentType "application/json" `
  -Body '{"category":"כללי","question":"מה הזכויות שלי בעבודה?"}'
```

إذا رجع JSON فيه `explanation` و `nextSteps` فالـ AI شغال.

## 3. شغل التطبيق على الكمبيوتر

ثبت الحزم ثم شغل Expo:

```powershell
pnpm install
pnpm run dev
```

إذا لم يكن `pnpm` مثبت:

```powershell
npm install -g pnpm
```

## 4. تشغيله على هاتف حقيقي

الهاتف لا يستطيع الوصول إلى `localhost` الموجود على الكمبيوتر. لازم تستخدم IP الكمبيوتر على نفس شبكة الواي فاي.

اعرف IP الكمبيوتر:

```powershell
ipconfig
```

ابحث عن `IPv4 Address`، مثلاً:

```text
192.168.1.20
```

ثم شغل Expo مع رابط السيرفر:

```powershell
$env:EXPO_PUBLIC_AI_API_URL="http://192.168.1.20:3000/api/chat"
pnpm run dev
```

افتح Expo Go على الهاتف وامسح QR code.

## 5. عند نشر التطبيق للجميع

لا تستخدم سيرفر محلي. ارفع `server/serve.js` على خدمة مثل Vercel أو Render، وضع `OPENROUTER_API_KEY` داخل Environment Variables في لوحة التحكم. بعدها اجعل التطبيق يستخدم رابط عام:

```env
EXPO_PUBLIC_AI_API_URL=https://your-server.example.com/api/chat
```

بهذه الطريقة المستخدمون يشغلون التطبيق، والتطبيق يرسل الأسئلة لسيرفرك، وسيرفرك فقط هو الذي يملك مفتاح OpenRouter.
