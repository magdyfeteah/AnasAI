# استخدام صورة Node.js
FROM node:18

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات التبعيات فقط لتسريع البناء
COPY package.json package-lock.json ./

# تثبيت التبعيات
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# فتح المنفذ 5173 (إذا كنت تستخدم Vite)
EXPOSE 5173

# تشغيل التطبيق (Vite)
CMD ["npm", "run", "dev"]
