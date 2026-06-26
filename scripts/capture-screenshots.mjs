import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const OUT_DIR = '/Users/cga-sec/Desktop/tovia/public/screenshots';

const AUTH_ENTRY = {
  fbase_key: 'firebase:authUser:AIzaSyDu6uRQ2f9RJEOtjH_HW8Rkh52IZ-HvLKg:[DEFAULT]',
  value: {"uid":"NNIxZV91ySTJI8ZYlhKZ0X088Af1","email":"teste@tovia.app","emailVerified":false,"isAnonymous":false,"providerData":[{"providerId":"password","uid":"teste@tovia.app","displayName":null,"email":"teste@tovia.app","phoneNumber":null,"photoURL":null}],"stsTokenManager":{"refreshToken":"AMf-vBwE7QVd_yDt1Pr_nISWekK7roOK6WbxbJx9l3Y9gQcbxBKtG5lhUzJfFLobzpkTKo8hGFwzqbIwQxARwjmhIe9QS33ufSUi6vxrGmcuZLUzQYb__tnEw96-YBjvPh4RbIKDWTfozKZaZFUXD54AkxxGTVphqqVx9QUoKCKBfhwadT2SZhmg_XlGwR1r46KjYSJ4UMpkI5Nd04JpQvuNL-VEIzaWz-51bUEsBGJpbRtTQzd6ZFs","accessToken":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjJmMjk1MGEyNGFlYWRkMjYzYzIxM2I2MDNhZjMxNWEzMjdiNmM3MjAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYWktc3R1ZGlvLWFwcGxldC13ZWJhcHAtODRmNjQiLCJhdWQiOiJhaS1zdHVkaW8tYXBwbGV0LXdlYmFwcC04NGY2NCIsImF1dGhfdGltZSI6MTc4MjQ0ODM0OCwidXNlcl9pZCI6Ik5OSXhaVjkxeVNUSkk4WllsaEtaMFgwODhBZjEiLCJzdWIiOiJOTkl4WlY5MXlTVEpJOFpZbGhLWjBYMDg4QWYxIiwiaWF0IjoxNzgyNDQ5NDE2LCJleHAiOjE3ODI0NTMwMTYsImVtYWlsIjoidGVzdGVAdG92aWEuYXBwIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInRlc3RlQHRvdmlhLmFwcCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.cqlNKkTWL3TtMIvrS3dfjsWJ_39u0mfA8fonHLIk7i3fY2ZcYRlnUApRNvhQoSBZIK-bRnMI9jSwPmpReuviUJqk3qXuPDyzEQ87tyxMq8ae3FFd6OdzGUHa9qVoEc63ZUE2SYL8-mytpgwcwxZDPH26U9t3_Hp8gj__OXf_ps09XaeGh5rp2m9rutqUlzgIRZVyKq5HTXn7e5ev_K82PkhEEW_Ut-soX7qeadV_JARtFmCRwjAxh7XfZHjwHR0SrRSyAoDuppE8vA7XaEKjt1A0VJTo9Uhsq4I_OLYHgUiIJgdRSwQomUfr98TSvfShz8aT0QCXWM3KiLypPIqMNw","expirationTime":1782453016000},"createdAt":"1782448348000","lastLoginAt":"1782448348000","apiKey":"AIzaSyDu6uRQ2f9RJEOtjH_HW8Rkh52IZ-HvLKg","appName":"[DEFAULT]"}
};

async function injectAuth(page) {
  await page.evaluate((entry) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('firebaseLocalStorage')) {
          db.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
        }
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('firebaseLocalStorage', 'readwrite');
        const store = tx.objectStore('firebaseLocalStorage');
        store.put(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = reject;
      };
      req.onerror = reject;
    });
  }, AUTH_ENTRY);
}

async function waitForAppLoad(page) {
  // Wait until the spinner disappears
  await page.waitForFunction(() => !document.querySelector('.animate-spin') && document.body.innerText.length > 50, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ── Passo 1: Criar conta ──
  await page.goto('http://localhost:3000/login?cadastro=true');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, 'step1-conta.jpg'), type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log('✅ step1-conta.jpg');

  // Inject auth before authenticated routes
  await page.goto('http://localhost:3000');
  await injectAuth(page);

  // ── Passo 2: Configure o evento ──
  await page.goto('http://localhost:3000/eventos/novo');
  await waitForAppLoad(page);
  // Dismiss any tour modal
  const closeBtn = page.locator('button[aria-label="Close"], button:has-text("×"), [data-radix-dialog-close]').first();
  if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'step2-evento.jpg'), type: 'jpeg', quality: 92 });
  console.log('✅ step2-evento.jpg');

  // ── Passo 3: Compartilhe o link (Páginas) ──
  await page.goto('http://localhost:3000/eventos/6dc725d7-a186-4548-ab52-9cc6b3da82e1');
  await waitForAppLoad(page);
  await page.waitForSelector('text=Páginas', { timeout: 12000 }).catch(() => {});
  await page.locator('text=Páginas').first().click().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'step3-paginas.jpg'), type: 'jpeg', quality: 92 });
  console.log('✅ step3-paginas.jpg');

  // ── Passo 4: Acompanhe tudo (Evento dashboard) ──
  await page.goto('http://localhost:3000/eventos/6dc725d7-a186-4548-ab52-9cc6b3da82e1');
  await waitForAppLoad(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'step4-dashboard.jpg'), type: 'jpeg', quality: 92 });
  console.log('✅ step4-dashboard.jpg');

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
