# Cars25 website

Vercel-ready Cars25 dealership website focused on quality pre-loved used cars for sale in Darlington.

## Included

- Premium Cars25 black and gold design using the supplied logo
- Home page with quick enquiry form, CSV-based stock stats and car slider
- Used cars page with Auto Trader-style listing cards
- Search, make, fuel, body type, transmission and sort filters generated from `data/stock.csv`
- SEO-friendly vehicle detail pages generated from the stock CSV
- Folder-based vehicle galleries by VRM
- Sell Your Car information page linking to `https://webuyyourcarnow.co.uk/`
- About page with dealer information and active director section
- Contact page with enquiry form, phone, WhatsApp and map embed
- Privacy and cookie policy pages
- Vercel deployment configuration
- Mailtrap SMTP contact endpoint for Vercel in `api/contact.js`
- PHP Mailtrap version in `php/contact.php` for PHP hosting
- Sitemap and robots.txt generated during build

## Update stock

The website reads stock from:

`data/stock.csv`

To update stock:

1. Export the latest Auto Trader forecourt CSV.
2. Replace `data/stock.csv` with the new file.
3. Keep the same column headings where possible.
4. Run:

```bash
npm run build
```

Only rows with `Stock status` equal to `Forecourt` and `Vehicle type` equal to `USED` are published.

The homepage stock count, automatic count, starting price, listing filters, vehicle cards and vehicle pages are all regenerated from this CSV.

## Update vehicle images

Images are folder based by registration number.

Example:

```text
public/assets/img/vehicles/OV15VDA/01.jpg
public/assets/img/vehicles/OV15VDA/02.jpg
public/assets/img/vehicles/OV15VDA/03.jpg
```

Use ordered filenames such as `01.jpg`, `02.jpg`, `03.jpg` and so on. The build script detects `.jpg`, `.jpeg`, `.png` and `.webp` files in each VRM folder.

After adding images, run:

```bash
npm run build
```

Then commit and push the updated files to GitHub so Vercel can redeploy.

## Deploy to Vercel

1. Upload this project to GitHub.
2. Import the repository in Vercel.
3. Vercel will use:

```text
Build command: npm run build
Output directory: dist
```

4. Add the Mailtrap environment variables in Vercel Project Settings.

Required variables:

```text
MAILTRAP_HOST
MAILTRAP_PORT
MAILTRAP_USER
MAILTRAP_PASS
MAIL_TO
MAIL_FROM
```

The active contact form posts to `/api/contact`, which is the Vercel serverless function in `api/contact.js`.

## PHP contact form note

Vercel does not run normal PHP files by default. The PHP Mailtrap file is included for PHP hosting or a future PHP setup:

```text
php/contact.php
php/composer.json
```

For PHP hosting, run `composer install` inside the `php` folder and point the form action to the PHP endpoint.

## Auto Trader feed/API later

When Auto Trader API or data feed access is enabled, the CSV step can be replaced by a scheduled feed import that writes the same fields into `data/stock.csv` or a JSON file before build.

Recommended Auto Trader request:

```text
Please enable Auto Trader Connect API access or stock data feed access for our Cars25 account so we can display stock, images, prices, availability and vehicle details on cars25.uk.
```

## Important checks before going live

- Confirm every price and mileage in `data/stock.csv` is current.
- Confirm availability before advertising any vehicle as in stock.
- Add all vehicle images into each VRM folder.
- Add real Mailtrap SMTP credentials in Vercel.
- Test the contact form on the Vercel preview URL.
- Confirm all legal and compliance wording before adding new regulated services or claims.
