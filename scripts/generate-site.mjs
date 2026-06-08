import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const DATA_CSV = path.join(ROOT, 'data', 'stock.csv');

const BRAND = {
  name: 'Cars25',
  legalName: 'Cars25 Limited',
  tagline: 'Quality Pre-Loved Cars',
  domain: 'https://cars25.uk',
  phoneDisplay: '+44 (0) 1325 514004',
  phoneTel: '+441325514004',
  mobileDisplay: '+44 (0) 7345 647243',
  mobileTel: '+447345647243',
  whatsapp: 'https://wa.me/447345647243',
  addressLines: ['Unit 3, Henson Road', 'Darlington', 'County Durham', 'DL1 4QD'],
  addressOneLine: 'Unit 3, Henson Road, Darlington, County Durham, DL1 4QD',
  autotraderProfile: 'https://www.autotrader.co.uk/dealers/county-durham/darlington/cars25-limited-10048195?channel=cars',
  autotraderStock: 'https://www.autotrader.co.uk/cars/retailer/stock?advertising-location=at_cars&advertising-location=at_profile_cars&onesearchad=Used&onesearchad=Nearly%20New&postcode=DL38BD&retailerId=10048195&sort=price-asc',
  sellYourCar: 'https://webuyyourcarnow.co.uk/',
  poweredBy: 'https://wannaapps.com'
};

const OFFICERS = [
  {
    name: 'Malaa Ayyappan',
    role: 'Director',
    appointed: '28 November 2025',
    status: 'Active'
  },
  {
    name: 'Amanullah Liyakath Ali',
    role: 'Director',
    appointed: '28 November 2025',
    status: 'Active',
    note: '20+ years of automobile industry experience'
  },
  {
    name: 'Gowthami Vanamoorthy Lingam',
    role: 'Director',
    appointed: '28 November 2025',
    status: 'Active'
  }
];

function cleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (path.basename(src).toLowerCase() === 'readme.txt') return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) copyRecursive(path.join(src, item), path.join(dest, item));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function writeFile(relativePath, content) {
  const target = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
  }
  const headers = rows.shift().map(h => h.trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function numeric(value) {
  const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value) {
  const n = numeric(value);
  return n ? `£${n.toLocaleString('en-GB')}` : 'Price on enquiry';
}

function formatMileage(value) {
  const n = numeric(value);
  return n ? `${n.toLocaleString('en-GB')} miles` : 'Mileage on enquiry';
}

function parseDate(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return { day: match[1], month: match[2], year: match[3], display: `${match[1]}/${match[2]}/${match[3]}` };
}

function detectTransmission(description = '') {
  const d = String(description || '').toLowerCase();

  const automaticTerms = [
    'automatic',
    ' auto ',
    's tronic',
    's-tronic',
    'g-tronic',
    'xtronic',
    'xtron',
    'cvt',
    'powershift',
    'multimode',
    'multitronic',
    'tiptronic',
    'steptronic',
    'dsg',
    'dct',
    'e-cvt'
  ];

  if (automaticTerms.some(term => d.includes(term))) {
    return 'Automatic';
  }

  if (d.includes('manual')) {
    return 'Manual';
  }

  if (!d.trim()) {
    return 'Contact dealer';
  }

  return 'Manual';
}

function detectMakeModel(description = '') {
  const d = description.trim();
  const patterns = [
    ['Mercedes-Benz', /^Mercedes-Benz\s+(A Class|A-Class|C Class|E Class|B Class)/i],
    ['Audi', /^Audi\s+(A6 Saloon|A6|A3|A4|Q[0-9])/i],
    ['BMW', /^BMW\s+([0-9]\sSeries|X[0-9]|[A-Za-z0-9-]+)/i],
    ['Ford', /^Ford\s+(B-Max|Fiesta|Focus|Ka|Kuga)/i],
    ['Honda', /^Honda\s+(Jazz|Civic|CR-V)/i],
    ['Mitsubishi', /^Mitsubishi\s+(ASX|Outlander|L200)/i],
    ['Nissan', /^Nissan\s+(Qashqai|Cube|Juke|Micra)/i],
    ['SEAT', /^(SEAT|Seat)\s+(Ibiza|Leon|Ateca)/i],
    ['Chevrolet', /^Chevrolet\s+(Cruze)/i],
    ['Vauxhall', /^Vauxhall\s+(Meriva|Astra|Corsa)/i]
  ];
  for (const [make, regex] of patterns) {
    const match = d.match(regex);
    if (match) {
      const model = make === 'SEAT' ? match[2] : match[1];
      return { make, model };
    }
  }
  const parts = d.split(/\s+/);
  return { make: parts[0] || 'Vehicle', model: parts[1] || 'Stock' };
}

function detectEngine(description = '') {
  const m = description.match(/\b(\d\.\d)\s*(?:L|TDI|DIG|i-VTEC|CDI|D|T)?/i);
  return m ? `${m[1]}L` : '';
}

function detectEuro(description = '') {
  const m = description.match(/Euro\s*\d(?:\s*\(s\/s\))?/i);
  return m ? m[0].replace(/\s+/g, ' ') : '';
}

function validColour(value = '') {
  const clean = value.trim();
  if (!clean || /^\d+$/.test(clean) || clean.toLowerCase() === 'nan') return '';
  return clean;
}

function validPriceIndicator(value = '') {
  const clean = String(value || '').trim().toLowerCase();
  if (!clean || clean.includes('no analysis')) return '';
  const allowed = ['great', 'good', 'fair', 'low'];
  if (!allowed.includes(clean)) return '';
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)} price`;
}

function findVehicleImages(vrm) {
  const dir = path.join(PUBLIC, 'assets', 'img', 'vehicles', vrm);
  const publicDir = `/assets/img/vehicles/${vrm}`;
  if (!fs.existsSync(dir)) return ['/assets/img/cars25-logo.png'];
  const files = fs.readdirSync(dir)
    .filter(file => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.length ? files.map(file => `${publicDir}/${file}`) : ['/assets/img/cars25-logo.png'];
}

function normalizeVehicle(row) {
  const description = (row['Description'] || '').trim();
  const { make, model } = detectMakeModel(description);
  const date = parseDate(row['Registration date']);
  const year = date?.year || '';
  const vrm = (row['VRM'] || '').replace(/\s+/g, '').toUpperCase();
  const transmission = detectTransmission(description);
  const engine = detectEngine(description);
  const euro = detectEuro(description);
  const price = numeric(row['Retail price']);
  const mileage = numeric(row['Mileage']);
  const slug = slugify(`${year}-${make}-${model}-${vrm}`);
  const ageId = (vrm.match(/^[A-Z]{2}(\d{2})[A-Z]{3}$/) || [])[1] || '';
  const images = findVehicleImages(vrm);
  const stockStatus = row['Stock status'] || '';
  const expectedImageCount = numeric(row['Images']);
  const title = description;
  const searchText = [title, make, model, row['Fuel'], row['Body Type'], transmission, year, row['Colour'], vrm].join(' ').toLowerCase();
  return {
    raw: row,
    description,
    fullTitle: title,
    pageTitle: `Used ${title} for sale in Darlington`,
    shortTitle: `${make} ${model}`,
    make,
    model,
    slug,
    url: `/vehicles/${slug}/`,
    vrm,
    year,
    ageId,
    registrationDate: date?.display || '',
    mileage,
    mileageDisplay: formatMileage(mileage),
    price,
    priceDisplay: formatMoney(price),
    stockStatus,
    priceIndicator: validPriceIndicator(row['Price indicator']),
    images,
    imageCount: images.length,
    expectedImageCount,
    video: row['Video'] || '',
    colour: validColour(row['Colour'] || ''),
    fuel: row['Fuel'] || '',
    bodyType: row['Body Type'] || '',
    doors: row['Doors'] || '',
    transmission,
    engine,
    euro,
    vehicleCheck: row['Vehicle check status'] || '',
    vin: row['Vin'] || '',
    did: row['DID'] || '',
    site: row['Site'] || '',
    performanceRating: row['Performance rating'] || '',
    searchText
  };
}

function loadVehicles() {
  const rows = parseCsv(fs.readFileSync(DATA_CSV, 'utf8'));
  return rows
    .filter(row => String(row['Stock status'] || '').toLowerCase() === 'forecourt')
    .filter(row => String(row['Vehicle type'] || '').toUpperCase() === 'USED')
    .map(normalizeVehicle)
    .sort((a, b) => b.price - a.price);
}

function nav() {
  return `
    <header class="site-header">
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="top-strip">
        <div class="container top-strip-inner">
          <span>Quality pre-loved used cars in Darlington, County Durham</span>
          <a href="tel:${BRAND.phoneTel}">${BRAND.phoneDisplay}</a>
        </div>
      </div>
      <nav class="navbar container" aria-label="Main navigation">
        <a class="brand" href="/" aria-label="Cars25 home">
          <img src="/assets/img/cars25-logo-wide.png" alt="Cars25 - Quality Pre-Loved Cars">
        </a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Open menu"><span></span><span></span><span></span></button>
        <div class="nav-links">
          <a href="/used-cars/">Used Cars</a>
          <a href="/sell-your-car/">Sell Your Car</a>
          <a href="/about/">About</a>
          <a href="/contact/">Contact</a>
        </div>
        <div class="nav-actions">
          <a class="btn btn-outline" href="tel:${BRAND.phoneTel}">Call now</a>
          <a class="btn btn-primary" href="/used-cars/">View Stock</a>
        </div>
      </nav>
    </header>`;
}

function footer(vehicles) {
  const makes = [...new Set(vehicles.map(v => v.make))].sort();
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <img class="footer-logo" src="/assets/img/cars25-logo-wide.png" alt="Cars25 - Quality Pre-Loved Cars">
          <p>Cars25 Limited offers quality pre-loved used cars from Darlington with clear pricing, stock details and quick enquiry options.</p>
        </div>
        <div>
          <h3>Used cars</h3>
          <ul>
            <li><a href="/used-cars/">Current stock</a></li>
            ${makes.slice(0, 5).map(make => `<li><a href="/used-cars/?make=${encodeURIComponent(make)}">Used ${escapeHtml(make)} cars</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>Contact</h3>
          <ul>
            <li>Office: <a href="tel:${BRAND.phoneTel}">${BRAND.phoneDisplay}</a></li>
            <li>Mobile: <a href="tel:${BRAND.mobileTel}">${BRAND.mobileDisplay}</a></li>
            <li>${BRAND.addressLines.map(escapeHtml).join('<br>')}</li>
            <li><a href="${BRAND.autotraderProfile}" target="_blank" rel="noopener">Auto Trader profile</a></li>
          </ul>
        </div>
        <div>
          <h3>Website</h3>
          <ul>
            <li><a href="/about/">About Cars25</a></li>
            <li><a href="/contact/">Contact Cars25</a></li>
            <li><a href="/privacy-policy/">Privacy policy</a></li>
            <li><a href="/cookie-policy/">Cookie policy</a></li>
          </ul>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Cars25 Limited. All rights reserved.</span>
        <span>Vehicle information should be confirmed with the dealer before travel.</span>
        <span class="powered">fueled by <a href="${BRAND.poweredBy}" target="_blank" rel="noopener">wannaapps</a></span>
      </div>
    </footer>`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data, null, 2).replace(/<\//g, '<\\/')}</script>`;
}

function layout({ title, description, body, vehicles, canonicalPath = '/', schema = [] }) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  const canonical = `${BRAND.domain}${canonicalPath === '/' ? '' : canonicalPath}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/img/favicon.png">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${BRAND.domain}/assets/img/cars25-logo.png">
  <link rel="preconnect" href="https://code.jquery.com">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="/assets/css/style.css">
  ${schemas.map(jsonLd).join('\n')}
</head>
<body>
  ${nav()}
  <main id="main">${body}</main>
  ${footer(vehicles)}
  <div class="cookie-banner" data-cookie-banner hidden>
    <p>We use essential cookies to run the website. Analytics can be added after cookie consent is configured.</p>
    <button class="btn btn-primary btn-small" type="button" data-cookie-accept>OK</button>
  </div>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.5/dist/jquery.validate.min.js"></script>
  <script src="/assets/js/stock-data.js"></script>
  <script src="/assets/js/main.js"></script>
</body>
</html>`;
}

function vehicleDetailsLine(vehicle) {
  return [vehicle.year, vehicle.mileageDisplay, vehicle.transmission, vehicle.fuel, vehicle.bodyType].filter(Boolean).join(' · ');
}

function priceBadge(vehicle) {
  return vehicle.priceIndicator ? `<span class="price-badge">${escapeHtml(vehicle.priceIndicator)}</span>` : '';
}

function card(vehicle) {
  return `
    <article class="vehicle-card" data-make="${escapeHtml(vehicle.make)}" data-fuel="${escapeHtml(vehicle.fuel)}" data-body="${escapeHtml(vehicle.bodyType)}" data-transmission="${escapeHtml(vehicle.transmission)}" data-price="${vehicle.price}" data-mileage="${vehicle.mileage}" data-year="${escapeHtml(vehicle.year)}" data-title="${escapeHtml(vehicle.searchText)}">
      <a class="vehicle-image-link" href="${vehicle.url}" aria-label="View ${escapeHtml(vehicle.fullTitle)}">
        <img src="${vehicle.images[0]}" alt="${escapeHtml(vehicle.fullTitle)}" loading="lazy">
        ${priceBadge(vehicle)}
      </a>
      <div class="vehicle-card-body">
        <p class="stock-label">${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</p>
        <h3><a href="${vehicle.url}">${escapeHtml(vehicle.fullTitle)}</a></h3>
        <p class="vehicle-meta">${escapeHtml(vehicleDetailsLine(vehicle))}</p>
        <div class="vehicle-card-footer">
          <strong>${vehicle.priceDisplay}</strong>
          <a class="text-link" href="${vehicle.url}">View details</a>
        </div>
      </div>
    </article>`;
}

function resultCard(vehicle) {
  const facts = [
    vehicle.registrationDate || vehicle.year,
    vehicle.mileageDisplay,
    vehicle.transmission,
    vehicle.fuel,
    vehicle.bodyType,
    vehicle.doors ? `${vehicle.doors} doors` : '',
    vehicle.colour
  ].filter(Boolean);
  return `
    <article class="vehicle-result-card" data-make="${escapeHtml(vehicle.make)}" data-fuel="${escapeHtml(vehicle.fuel)}" data-body="${escapeHtml(vehicle.bodyType)}" data-transmission="${escapeHtml(vehicle.transmission)}" data-price="${vehicle.price}" data-mileage="${vehicle.mileage}" data-year="${escapeHtml(vehicle.year)}" data-title="${escapeHtml(vehicle.searchText)}">
      <a class="result-image" href="${vehicle.url}" aria-label="View ${escapeHtml(vehicle.fullTitle)}">
        <img src="${vehicle.images[0]}" alt="${escapeHtml(vehicle.fullTitle)}" loading="lazy">
        ${vehicle.expectedImageCount ? `<span class="image-count">${vehicle.expectedImageCount} photos</span>` : ''}
      </a>
      <div class="result-content">
        <div class="result-title-row">
          <div>
            <p class="stock-label">${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</p>
            <h2><a href="${vehicle.url}">${escapeHtml(vehicle.fullTitle)}</a></h2>
          </div>
          <div class="result-price"><strong>${vehicle.priceDisplay}</strong>${vehicle.priceIndicator ? `<span>${escapeHtml(vehicle.priceIndicator)}</span>` : ''}</div>
        </div>
        <ul class="result-facts">
          ${facts.map(fact => `<li>${escapeHtml(fact)}</li>`).join('')}
        </ul>
        <p class="result-copy">Available from Cars25 in Darlington. Open the vehicle profile for image gallery, key details and quick contact options.</p>
        <div class="result-actions">
          <a class="btn btn-primary" href="${vehicle.url}">View vehicle</a>
          <a class="btn btn-outline btn-on-light" href="tel:${BRAND.phoneTel}">Call now</a>
        </div>
      </div>
    </article>`;
}

function quickContactForm({ vehicle = '', compact = false } = {}) {
  const defaultMessage = vehicle
    ? `Hello Cars25, I am interested in the ${vehicle}. Please contact me with availability.`
    : 'Hello Cars25, I am interested in your current used car stock. Please contact me.';
  return `
    <form class="contact-form ${compact ? 'compact-form' : ''}" action="/api/contact" method="post" novalidate>
      <input type="hidden" name="source" value="Cars25 website enquiry">
      <label>
        <span>Name</span>
        <input type="text" name="name" autocomplete="name" required minlength="2">
      </label>
      <label>
        <span>Phone</span>
        <input type="tel" name="phone" autocomplete="tel" required>
      </label>
      <label>
        <span>Email</span>
        <input type="email" name="email" autocomplete="email">
      </label>
      <label>
        <span>Vehicle</span>
        <input type="text" name="vehicle" value="${escapeHtml(vehicle)}" placeholder="Vehicle you are interested in">
      </label>
      <label class="full-field">
        <span>Message</span>
        <textarea name="message" rows="4" required>${escapeHtml(defaultMessage)}</textarea>
      </label>
      <button class="btn btn-primary" type="submit">Send enquiry</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>`;
}

function stockStats(vehicles) {
  const total = vehicles.length;
  const auto = vehicles.filter(v => v.transmission === 'Automatic').length;
  const lowest = vehicles.reduce((min, v) => v.price && v.price < min ? v.price : min, Infinity);
  return `
    <div class="stats-row" aria-label="Cars25 stock summary">
      <div><strong>${total}</strong><span>used cars</span></div>
      <div><strong>${auto}</strong><span>automatic options</span></div>
      <div><strong>${Number.isFinite(lowest) ? formatMoney(lowest) : 'Ask'}</strong><span>starting price</span></div>
      <div><strong>5/5</strong><span>Auto Trader profile rating</span></div>
    </div>`;
}

function homepage(vehicles) {
  const featured = vehicles.slice(0, Math.min(5, vehicles.length));
  const body = `
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Cars25 Darlington</p>
          <h1>Used cars in Darlington from Cars25</h1>
          <p class="lead">Browse quality pre-loved cars from Cars25 Limited in Darlington. View live stock, compare key details and contact the team before travelling.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="/used-cars/">Browse used cars</a>
            <a class="btn btn-outline" href="tel:${BRAND.phoneTel}">Call ${BRAND.phoneDisplay}</a>
          </div>
          ${stockStats(vehicles)}
          <div class="hero-slider-card">
            <div class="stock-slider" data-stock-slider>
              ${featured.map((vehicle, index) => `
                <a class="stock-slide ${index === 0 ? 'active' : ''}" href="${vehicle.url}">
                  <img src="${vehicle.images[0]}" alt="${escapeHtml(vehicle.fullTitle)}">
                  <span>${escapeHtml(vehicle.shortTitle)} · ${vehicle.priceDisplay}</span>
                </a>`).join('')}
            </div>
          </div>
        </div>
        <aside class="quick-contact-card hero-enquiry">
          <p class="eyebrow">Quick contact</p>
          <h2>Ask about a used car</h2>
          <p>Send a quick enquiry about availability, viewing times or any vehicle listed on Cars25.uk.</p>
          ${quickContactForm({ compact: true })}
        </aside>
      </div>
    </section>

    <section class="section container">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Current stock</p>
          <h2>Featured used cars</h2>
        </div>
      <p>Browse our latest hand-picked used cars in Darlington. Each vehicle is presented with clear photos, pricing, mileage and key details so you can enquire with confidence before visiting Cars25.</p>      </div>
      <div class="vehicle-grid featured-grid">
        ${vehicles.map(v => card(v)).join('')}
      </div>
      <div class="center-action"><a class="btn btn-primary" href="/used-cars/">View all stock</a></div>
    </section>

    <section class="section trust-section">
      <div class="container trust-grid">
        <div>
          <p class="eyebrow">Why Cars25</p>
          <h2>A focused used car dealer in Darlington</h2>
          <p>Cars25 is built for customers who want clear vehicle information before they call. The website presents price, mileage, photos, fuel type, body style and enquiry options in a clean mobile-friendly layout.</p>
          <p>For local SEO, the site is structured around used cars in Darlington, second hand cars in County Durham and pre-owned vehicle searches near Henson Road.</p>
        </div>
        <div class="trust-cards">
          <article><h3>No admin fees</h3><p>Clearer pricing helps customers understand the cost before they enquire.</p></article>
          <article><h3>Local Darlington stock</h3><p>Cars25 Limited is based at Unit 3, Henson Road, Darlington, DL1 4QD.</p></article>
          <article><h3>Fast contact</h3><p>Every vehicle page gives customers call, WhatsApp and website enquiry options.</p></article>
        </div>
      </div>
    </section>

    <section class="section container two-column seo-block">
      <div>
        <p class="eyebrow">Used car search</p>
        <h2>Find the right pre-loved car in Darlington</h2>
        <p>Cars25.uk is designed to make stock discovery simple. Customers can browse automatic cars, hatchbacks, saloons, SUVs and MPVs, then open each vehicle page for specification, mileage, price and photo gallery.</p>
        <p>The aim is to give Darlington buyers a professional dealership experience online, while keeping the enquiry journey quick and direct.</p>
      </div>
      <div class="cta-card">
        <h3>Selling your vehicle?</h3>
        <p>Cars25.uk focuses on cars for sale. Seller enquiries are routed through the dedicated valuation journey at webuyyourcarnow.co.uk.</p>
        <a class="btn btn-primary" href="${BRAND.sellYourCar}" target="_blank" rel="noopener">Visit webuyyourcarnow.co.uk</a>
      </div>
    </section>`;
  const schema = [localBusinessSchema(), websiteSchema()];
  return layout({
    title: 'Cars25 | Used Cars in Darlington | Quality Pre-Loved Cars',
    description: 'Cars25 Limited sells quality pre-loved used cars in Darlington, County Durham. Browse current stock, view vehicle details and contact the team.',
    body,
    vehicles,
    canonicalPath: '/',
    schema
  });
}

function usedCarsPage(vehicles) {
  const makes = [...new Set(vehicles.map(v => v.make))].sort();
  const fuels = [...new Set(vehicles.map(v => v.fuel).filter(Boolean))].sort();
  const bodies = [...new Set(vehicles.map(v => v.bodyType).filter(Boolean))].sort();
  const transmissions = [...new Set(vehicles.map(v => v.transmission).filter(Boolean))].sort();
  const body = `
    <section class="page-hero compact-page-hero">
      <div class="container">
        <p class="eyebrow">Cars25 stock</p>
        <h1>Used cars for sale in Darlington</h1>
        <p>Browse current Cars25 stock by make, fuel type, body style, transmission, price and mileage. Open any vehicle to view the photo gallery, key details and quick enquiry options.</p>
      </div>
    </section>
    <section class="section container stock-layout">
      <aside class="filter-panel" aria-label="Stock filters">
        <h2>Filter stock</h2>
        <label><span>Search</span><input type="search" id="stockSearch" placeholder="Make, model or keyword"></label>
        <label><span>Make</span><select id="makeFilter"><option value="">All makes</option>${makes.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
        <label><span>Fuel</span><select id="fuelFilter"><option value="">All fuel types</option>${fuels.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
        <label><span>Body type</span><select id="bodyFilter"><option value="">All body types</option>${bodies.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
        <label><span>Transmission</span><select id="transmissionFilter"><option value="">All transmissions</option>${transmissions.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}</select></label>
        <label><span>Sort</span><select id="stockSort"><option value="price-desc">Price high to low</option><option value="price-asc">Price low to high</option><option value="mileage-asc">Mileage low to high</option><option value="year-desc">Year newest first</option></select></label>
        <button class="btn btn-outline btn-on-light full-width" type="button" id="resetFilters">Reset filters</button>
      </aside>
      <div class="stock-results">
        <div class="stock-toolbar"><strong><span id="stockCount">${vehicles.length}</span> cars available</strong><a class="text-link" href="tel:${BRAND.phoneTel}">Call ${BRAND.phoneDisplay}</a></div>
        <div class="vehicle-results" id="stockGrid">
          ${vehicles.map(v => resultCard(v)).join('')}
        </div>
        <p class="empty-state" id="emptyState" hidden>No cars match the selected filters. Try removing a filter or call the team for availability.</p>
      </div>
    </section>
    <section class="section container prose seo-copy">
      <h2>Used cars Darlington buyers can view online first</h2>
      <p>Cars25 helps local buyers compare used cars in Darlington before making a call. Each stock profile includes clear price, mileage, transmission, fuel type, body style and available images to reduce uncertainty before visiting.</p>
      <h2>Popular searches supported by Cars25 stock</h2>
      <p>The stock page is designed for searches such as used cars Darlington, second hand cars Darlington, automatic used cars Darlington, affordable used cars County Durham and quality pre-loved cars near Henson Road.</p>
    </section>`;
  return layout({
    title: 'Used Cars Darlington | Cars25 Current Stock',
    description: 'Browse Cars25 current used car stock in Darlington. Filter by make, fuel, body type, transmission, price and mileage.',
    body,
    vehicles,
    canonicalPath: '/used-cars/',
    schema: [localBusinessSchema(), collectionSchema(vehicles)]
  });
}

function aboutPage(vehicles) {
  const team = [
    {
      name: 'Amanullah Liyakath Ali',
      role: 'Director',
      linkedin: 'https://linkedin.com', // Add Amanullah LinkedIn URL here
      bio: 'Amanullah brings more than 20 years of experience in the automotive industry, with strong practical knowledge of vehicle sourcing, customer expectations, stock quality and dealership operations. His industry experience helps Cars25 focus on the right cars, clear communication and a reliable buying experience for customers in Darlington.'
    },
    {
      name: 'Malaa Ayyappan',
      role: 'Director',
      linkedin: 'https://linkedin.com', // Add Malaa LinkedIn URL here
      bio: 'Malaa brings a strong IT and data-driven background to Cars25, supporting the business with structured thinking, process clarity and a modern digital approach. Her experience helps the company stay organised, customer-focused and ready to grow with the right technology foundations.'
    },
    {
      name: 'Gowthami Vanamoorthy Lingam',
      role: 'Director',
      linkedin: 'https://linkedin.com', // Add Gowthami LinkedIn URL here
      bio: 'Gowthami brings valuable experience from the IT and business operations space, helping Cars25 combine traditional motor trade knowledge with a modern, systems-led approach. This supports better visibility, smoother customer journeys and a scalable digital future for the business.'
    }
  ];

  const body = `
    <section class="page-hero compact-page-hero">
      <div class="container">
        <p class="eyebrow">About Cars25</p>
        <h1>Quality pre-loved cars in Darlington</h1>
        <p>Cars25 Limited is a Darlington based used car dealer focused on quality pre-loved vehicles, clear information, professional presentation and a smooth customer experience from first search to final enquiry.</p>
      </div>
    </section>

    <section class="section container two-column about-intro">
      <div>
        <h2>A modern used car dealer built on experience, trust and technology</h2>
        <p>Cars25 has been created with a simple goal: to make buying a used car in Darlington feel clearer, easier and more reliable. Customers want confidence before they travel, so our website is designed to show the important details upfront, including price, mileage, fuel type, transmission, body style, photos and quick contact options.</p>

        <p>The strength of Cars25 comes from combining hands-on automotive experience with technology, digital systems and customer-focused processes. This allows the business to operate like a modern dealership, with better stock presentation, faster enquiries and a more professional online journey.</p>

        <p>Whether customers are searching for used cars in Darlington, second hand cars in County Durham or quality pre-loved cars near Henson Road, Cars25 aims to give them a clean, transparent and trustworthy place to start.</p>

        <div class="inline-actions">
          <a class="btn btn-primary" href="/used-cars/">Browse current stock</a>
          <a class="btn btn-outline btn-on-light" href="${BRAND.autotraderProfile}" target="_blank" rel="noopener">View Auto Trader profile</a>
        </div>
      </div>

      <div class="info-card">
        <h2>Dealer information</h2>
        <dl class="detail-list">
          <div><dt>Business</dt><dd>${BRAND.legalName}</dd></div>
          <div><dt>Location</dt><dd>${BRAND.addressLines.map(escapeHtml).join('<br>')}</dd></div>
          <div><dt>Phone</dt><dd><a href="tel:${BRAND.phoneTel}">${BRAND.phoneDisplay}</a></dd></div>
          <div><dt>Specialism</dt><dd>Quality pre-loved used cars</dd></div>
        </dl>
      </div>
    </section>

    <section class="section leadership-section">
      <div class="container">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Meet the team</p>
            <h2>The people behind Cars25</h2>
          </div>
          <p>Cars25 is led by a team that combines automotive knowledge, IT experience, operational thinking and digital ambition. The aim is not just to sell cars, but to build a trusted, technology-enabled used car brand in Darlington.</p>
        </div>

        <div class="officer-grid team-grid">
          ${team.map(member => `
            <article class="officer-card team-card">
              <span>${escapeHtml(member.role)}</span>
              <h3>${escapeHtml(member.name)}</h3>
              <p>${escapeHtml(member.bio)}</p>
              ${member.linkedin ? `<a class="btn btn-outline btn-on-light btn-small" href="${escapeHtml(member.linkedin)}" target="_blank" rel="noopener">View LinkedIn</a>` : ''}
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section container two-column seo-block">
      <div>
        <p class="eyebrow">Our approach</p>
        <h2>Professional stock presentation for Darlington buyers</h2>
        <p>Cars25.uk is built to help customers compare vehicles online before contacting the dealership. Each car profile is designed to show the key information clearly, supported by photos, vehicle specifications and direct contact options.</p>
        <p>This approach helps Cars25 build trust locally while also improving visibility for searches such as used cars Darlington, second hand cars Darlington and pre-loved cars in County Durham.</p>
      </div>

      <div class="cta-card">
        <h3>Looking for your next car?</h3>
        <p>Browse the latest Cars25 stock online and contact the team to confirm availability, viewing times and vehicle details before travelling.</p>
        <a class="btn btn-primary" href="/used-cars/">View used cars</a>
      </div>
    </section>
  `;

  return layout({
    title: 'About Cars25 Limited | Used Car Dealer Darlington',
    description: 'Learn about Cars25 Limited, a Darlington used car dealer offering quality pre-loved cars with automotive experience, IT knowledge and a modern customer-first approach.',
    body,
    vehicles,
    canonicalPath: '/about/',
    schema: [localBusinessSchema()]
  });
}

function sellYourCarPage(vehicles) {
  const body = `
    <section class="page-hero compact-page-hero">
      <div class="container">
        <p class="eyebrow">Sell your car</p>
        <h1>Want to sell your car?</h1>
        <p>Cars25.uk is focused on used cars for sale in Darlington. Seller enquiries are handled through the dedicated vehicle selling journey at webuyyourcarnow.co.uk.</p>
      </div>
    </section>
    <section class="section container two-column">
      <div>
        <h2>Use the dedicated seller website</h2>
        <p>If you want to start a car selling enquiry, please use webuyyourcarnow.co.uk. The seller site is designed for a quick start using your vehicle registration and mileage.</p>
        <p>This keeps Cars25.uk clean for buyers while seller enquiries are routed separately through a focused valuation journey.</p>
        <div class="inline-actions"><a class="btn btn-primary" href="${BRAND.sellYourCar}" target="_blank" rel="noopener">Go to webuyyourcarnow.co.uk</a><a class="btn btn-outline btn-on-light" href="/used-cars/">Browse Cars25 stock</a></div>
      </div>
      <div class="info-card gold-card">
        <h2>How it helps</h2>
        <ul class="check-list">
          <li>Separate seller journey for vehicle owners</li>
          <li>Registration and mileage based entry point</li>
          <li>Cleaner stock website for buyers</li>
          <li>Better lead routing as the business grows</li>
        </ul>
      </div>
    </section>`;
  return layout({
    title: 'Sell Your Car | Cars25 and webuyyourcarnow.co.uk',
    description: 'Want to sell your car? Cars25 directs seller enquiries to webuyyourcarnow.co.uk while Cars25.uk focuses on used cars for sale in Darlington.',
    body,
    vehicles,
    canonicalPath: '/sell-your-car/',
    schema: [localBusinessSchema()]
  });
}

function contactPage(vehicles) {
  const body = `
    <section class="page-hero compact-page-hero">
      <div class="container">
        <p class="eyebrow">Contact Cars25</p>
        <h1>Speak to Cars25 about a used car</h1>
        <p>Call, WhatsApp or send an enquiry before travelling to confirm availability, viewing details and stock information.</p>
      </div>
    </section>
    <section class="section container contact-grid">
      <div class="contact-card">
        <h2>Send an enquiry</h2>
        ${quickContactForm()}
      </div>
      <div class="info-card">
        <h2>Get in touch</h2>
        <dl class="detail-list">
          <div><dt>Office phone</dt><dd><a href="tel:${BRAND.phoneTel}">${BRAND.phoneDisplay}</a></dd></div>
          <div><dt>Mobile</dt><dd><a href="tel:${BRAND.mobileTel}">${BRAND.mobileDisplay}</a></dd></div>
          <div><dt>WhatsApp</dt><dd><a href="${BRAND.whatsapp}" target="_blank" rel="noopener">Message Cars25 on WhatsApp</a></dd></div>          <div><dt>Address</dt><dd>${BRAND.addressLines.map(escapeHtml).join('<br>')}</dd></div>
          <div><dt>Auto Trader</dt><dd><a href="${BRAND.autotraderProfile}" target="_blank" rel="noopener">View Cars25 profile</a></dd></div>
        </dl>
        <iframe class="map-frame" title="Cars25 Darlington map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(BRAND.addressOneLine)}&output=embed"></iframe>
      </div>
    </section>`;
  return layout({
    title: 'Contact Cars25 | Used Car Dealer Darlington',
    description: 'Contact Cars25 Limited in Darlington about current used cars. Call, WhatsApp or send an enquiry before travelling.',
    body,
    vehicles,
    canonicalPath: '/contact/',
    schema: [localBusinessSchema()]
  });
}

function policyPage(vehicles, type) {
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Cookie Policy';
  const pathName = isPrivacy ? '/privacy-policy/' : '/cookie-policy/';
  const body = `
    <section class="page-hero compact-page-hero">
      <div class="container">
        <p class="eyebrow">Cars25 website</p>
        <h1>${title}</h1>
        <p>This page explains how the Cars25 website handles ${isPrivacy ? 'enquiry information' : 'cookies and similar technologies'}.</p>
      </div>
    </section>
    <section class="section container prose">
      ${isPrivacy ? `
        <h2>Information collected</h2>
        <p>When you submit an enquiry, Cars25 may receive your name, phone number, email address, message and the vehicle you are interested in.</p>
        <h2>How information is used</h2>
        <p>Enquiry information is used to respond to your request, confirm availability and arrange follow up communication about Cars25 stock.</p>
        <h2>Contact forms</h2>
        <p>The contact form can send enquiries through the configured SMTP service. Do not include payment details or sensitive personal information in website forms.</p>
        <h2>Your choices</h2>
        <p>You can contact Cars25 using ${BRAND.phoneDisplay} if you want to discuss an enquiry or ask for your information to be removed from follow up records.</p>` : `
        <h2>Essential cookies</h2>
        <p>The website may use essential cookies or local storage to remember basic preferences such as cookie banner acknowledgement.</p>
        <h2>Analytics cookies</h2>
        <p>Analytics placeholders are included for future setup. Analytics should only be activated after consent and tracking configuration are complete.</p>
        <h2>Managing cookies</h2>
        <p>You can control cookies through your browser settings. Blocking some cookies may affect website features.</p>`}
    </section>`;
  return layout({
    title: `${title} | Cars25`,
    description: `${title} for Cars25.uk, the Darlington used car website for Cars25 Limited.`,
    body,
    vehicles,
    canonicalPath: pathName,
    schema: [localBusinessSchema()]
  });
}

function vehicleDescription(vehicle) {
  const details = [
    vehicle.year ? `${vehicle.year} registration` : '',
    vehicle.mileageDisplay,
    vehicle.transmission,
    vehicle.fuel,
    vehicle.bodyType,
    vehicle.doors ? `${vehicle.doors} doors` : '',
    vehicle.engine,
    vehicle.euro
  ].filter(Boolean).join(', ');
  return `This ${escapeHtml(vehicle.fullTitle)} is available from Cars25 Limited in Darlington. Key details include ${escapeHtml(details)}. The vehicle is listed at ${escapeHtml(vehicle.priceDisplay)}. Please contact Cars25 before travelling to confirm availability, condition, documentation and viewing arrangements.`;
}

function galleryThumbs(vehicle) {
  return vehicle.images.map((img, index) => `<button type="button" class="thumb ${index === 0 ? 'active' : ''}" data-photo="${img}"><img src="${img}" alt="${escapeHtml(vehicle.shortTitle)} photo ${index + 1}"></button>`).join('');
}

function vehiclePage(vehicle, vehicles) {
  const specs = [
    ['Price', vehicle.priceDisplay],
    ['Mileage', vehicle.mileageDisplay],
    ['Registration', vehicle.registrationDate || vehicle.year],
    ['Fuel', vehicle.fuel],
    ['Transmission', vehicle.transmission],
    ['Body type', vehicle.bodyType],
    ['Doors', vehicle.doors],
    ['Colour', vehicle.colour],
    ['Engine', vehicle.engine],
    ['Emissions standard', vehicle.euro],
    ['Vehicle check', vehicle.vehicleCheck],
    ['Registration mark', vehicle.vrm]
  ].filter(([_, value]) => value);
  const schema = [localBusinessSchema(), vehicleSchema(vehicle)];
  const body = `
    <section class="vehicle-page-header">
      <div class="container breadcrumbs"><a href="/">Home</a><span>/</span><a href="/used-cars/">Used Cars</a><span>/</span><span>${escapeHtml(vehicle.shortTitle)}</span></div>
    </section>
    <section class="section container vehicle-detail-grid">
      <div class="vehicle-gallery" data-gallery data-vrm="${escapeHtml(vehicle.vrm)}" data-expected-image-count="${vehicle.expectedImageCount || vehicle.images.length}">
        <div class="main-photo"><img src="${vehicle.images[0]}" alt="${escapeHtml(vehicle.fullTitle)}" data-main-photo></div>
        <div class="thumb-row" data-thumb-row>
          ${galleryThumbs(vehicle)}
        </div>
      </div>
      <aside class="vehicle-summary-card">
        <p class="stock-label">${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</p>
        <h1>${escapeHtml(vehicle.fullTitle)}</h1>
        <p class="vehicle-price">${vehicle.priceDisplay}</p>
        <div class="summary-facts">
          <span>${vehicle.mileageDisplay}</span>
          <span>${escapeHtml(vehicle.transmission)}</span>
          <span>${escapeHtml(vehicle.fuel)}</span>
          <span>${escapeHtml(vehicle.bodyType)}</span>
        </div>
        <div class="summary-actions">
          <a class="btn btn-primary" href="tel:${BRAND.phoneTel}">Call ${BRAND.phoneDisplay}</a>
          <a class="btn btn-outline btn-on-light" href="${BRAND.whatsapp}?text=${encodeURIComponent(`Hello Cars25, I am interested in the ${vehicle.fullTitle}. Is it still available?`)}" target="_blank" rel="noopener">WhatsApp enquiry</a>
        </div>
        <p class="small-note">Please confirm availability before travelling to view this vehicle.</p>
      </aside>
    </section>
    <section class="section container vehicle-content-grid">
      <div class="vehicle-main-copy">
        <h2>Vehicle overview</h2>
        <p>${vehicleDescription(vehicle)}</p>
        <h2>Key details</h2>
        <dl class="spec-grid">
          ${specs.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
        </dl>
        <h2>Why enquire with Cars25?</h2>
        <ul class="check-list">
          <li>Darlington based used car dealer</li>
          <li>Clear price, mileage and vehicle information</li>
          <li>Call, WhatsApp and website enquiry options</li>
          <li>Vehicle stock presented with a dedicated page for every car</li>
        </ul>
      </div>
      <aside class="contact-card sticky-card">
        <h2>Enquire about this car</h2>
        ${quickContactForm({ vehicle: vehicle.fullTitle, compact: true })}
      </aside>
    </section>
    <section class="section container">
      <div class="section-heading">
        <div>
          <p class="eyebrow">More from Cars25</p>
          <h2>Other used cars in Darlington</h2>
        </div>
      </div>
      <div class="vehicle-grid featured-grid">
        ${vehicles.filter(v => v.vrm !== vehicle.vrm).slice(0, 3).map(v => card(v)).join('')}
      </div>
    </section>`;
  return layout({
    title: `${vehicle.shortTitle} for Sale Darlington | Cars25`,
    description: `View this ${vehicle.fullTitle} from Cars25 in Darlington. ${vehicle.mileageDisplay}, ${vehicle.fuel}, ${vehicle.transmission}, listed at ${vehicle.priceDisplay}.`,
    body,
    vehicles,
    canonicalPath: vehicle.url,
    schema
  });
}

function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: BRAND.legalName,
    url: BRAND.domain,
    telephone: BRAND.phoneDisplay,
    image: `${BRAND.domain}/assets/img/cars25-logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Unit 3, Henson Road',
      addressLocality: 'Darlington',
      addressRegion: 'County Durham',
      postalCode: 'DL1 4QD',
      addressCountry: 'GB'
    },
    areaServed: ['Darlington', 'County Durham'],
    sameAs: [BRAND.autotraderProfile]
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cars25',
    url: BRAND.domain,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BRAND.domain}/used-cars/?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

function collectionSchema(vehicles) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Used cars for sale in Darlington',
    url: `${BRAND.domain}/used-cars/`,
    mainEntity: vehicles.map(v => ({ '@type': 'Product', name: v.fullTitle, url: `${BRAND.domain}${v.url}`, image: `${BRAND.domain}${v.images[0]}`, offers: { '@type': 'Offer', priceCurrency: 'GBP', price: v.price, availability: 'https://schema.org/InStock' } }))
  };
}

function vehicleSchema(vehicle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: vehicle.fullTitle,
    brand: { '@type': 'Brand', name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'SMI' },
    fuelType: vehicle.fuel,
    bodyType: vehicle.bodyType,
    vehicleTransmission: vehicle.transmission,
    color: vehicle.colour || undefined,
    image: vehicle.images.map(img => `${BRAND.domain}${img}`),
    offers: { '@type': 'Offer', priceCurrency: 'GBP', price: vehicle.price, availability: 'https://schema.org/InStock', seller: { '@type': 'AutoDealer', name: BRAND.legalName } }
  };
}

function writeStockData(vehicles) {
  const payload = vehicles.map(v => ({
    title: v.fullTitle,
    shortTitle: v.shortTitle,
    make: v.make,
    model: v.model,
    vrm: v.vrm,
    year: v.year,
    price: v.price,
    priceDisplay: v.priceDisplay,
    mileage: v.mileage,
    mileageDisplay: v.mileageDisplay,
    fuel: v.fuel,
    bodyType: v.bodyType,
    transmission: v.transmission,
    image: v.images[0],
    expectedImageCount: v.expectedImageCount,
    url: v.url
  }));
  writeFile('assets/js/stock-data.js', `window.CARS25_STOCK = ${JSON.stringify(payload, null, 2)};\n`);
}

function writeSitemap(vehicles) {
  const paths = ['/', '/used-cars/', '/about/', '/sell-your-car/', '/contact/', '/privacy-policy/', '/cookie-policy/', ...vehicles.map(v => v.url)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>${BRAND.domain}${p === '/' ? '' : p}</loc><changefreq>${p.startsWith('/vehicles/') ? 'daily' : 'weekly'}</changefreq><priority>${p === '/' ? '1.0' : p.startsWith('/vehicles/') ? '0.8' : '0.7'}</priority></url>`).join('\n')}\n</urlset>`;
  writeFile('sitemap.xml', xml);
  writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${BRAND.domain}/sitemap.xml\n`);
}

function writeImageFolderReadmes(vehicles) {
  for (const vehicle of vehicles) {
    const dir = path.join(ROOT, 'public', 'assets', 'img', 'vehicles', vehicle.vrm);
    fs.mkdirSync(dir, { recursive: true });
    const note = `Vehicle: ${vehicle.fullTitle}\nVRM folder: ${vehicle.vrm}\n\nAdd vehicle images here using ordered filenames such as 01.jpg, 02.jpg, 03.jpg or 01.webp.\nThe website build script detects jpg, jpeg, png and webp files in this folder and uses them in the gallery.\nAfter adding images, run npm run build before deploying.\nThe uploaded stock CSV currently reports ${vehicle.expectedImageCount || 'no'} image(s) for this vehicle.\n`;
    fs.writeFileSync(path.join(dir, 'README.txt'), note, 'utf8');
  }
}

function main() {
  const vehicles = loadVehicles();
  writeImageFolderReadmes(vehicles);
  cleanDir(DIST);
  copyRecursive(PUBLIC, DIST);
  writeStockData(vehicles);
  writeFile('index.html', homepage(vehicles));
  writeFile('used-cars/index.html', usedCarsPage(vehicles));
  writeFile('about/index.html', aboutPage(vehicles));
  writeFile('sell-your-car/index.html', sellYourCarPage(vehicles));
  writeFile('contact/index.html', contactPage(vehicles));
  writeFile('privacy-policy/index.html', policyPage(vehicles, 'privacy'));
  writeFile('cookie-policy/index.html', policyPage(vehicles, 'cookie'));
  for (const vehicle of vehicles) writeFile(`vehicles/${vehicle.slug}/index.html`, vehiclePage(vehicle, vehicles));
  writeSitemap(vehicles);
  console.log(`Generated Cars25 website with ${vehicles.length} forecourt vehicles.`);
}

main();
