# kulbatskii.com

Сайт KULBATSKII — AI-автоматизация для производства и B2B. Статический сайт, без сборки: 5 HTML-страниц + один CSS-файл.

## Структура

```
index.html      — главная
services.html   — услуги
cases.html      — кейсы
team.html       — команда
contact.html    — контакты (форма через FormSubmit)
css/main.css    — вся дизайн-система
favicon.svg
vercel.json     — чистые URL без .html (/services вместо /services.html)
robots.txt, sitemap.xml
```

## Деплой на Vercel

1. Зайти на [vercel.com](https://vercel.com) → **Add New → Project**.
2. Импортировать репозиторий `ku1batskii/kulbatskii.com` (или подключить GitHub-аккаунт, если ещё не подключён).
3. Framework Preset — **Other** (это чистый статический сайт, build command и output directory оставить пустыми).
4. Deploy. Через минуту будет доступен адрес вида `kulbatskii-com.vercel.app`.

## Подключение домена с GoDaddy

1. В проекте на Vercel: **Settings → Domains** → добавить `kulbatskii.com` (и опционально `www.kulbatskii.com`).
2. Vercel покажет DNS-записи, которые нужно добавить. Обычно это:
   - Для корневого домена `kulbatskii.com`: **A-запись** → `76.76.21.21`
   - Для `www.kulbatskii.com`: **CNAME-запись** → `cname.vercel-dns.com`
3. Зайти в GoDaddy → **My Products → DNS** (управление DNS для домена) и добавить/поменять эти записи (обычно там уже есть A-запись на "парковочную" страницу GoDaddy — её нужно заменить).
4. Подождать обновления DNS (обычно от нескольких минут до пары часов). Vercel сам выпустит SSL-сертификат, как только увидит правильные записи.
5. В Vercel указать `kulbatskii.com` как основной домен, а `www` сделать редиректом на него (или наоборот) — настраивается там же, в Domains.

## Форма обратной связи

Форма на `/contact` отправляет письма на `apk181818@gmail.com` через [FormSubmit](https://formsubmit.co) — бесплатный сервис без бэкенда. При первой отправке с сайта FormSubmit пришлёт на почту письмо с просьбой подтвердить адрес — это разовое действие, после подтверждения форма работает сразу.
