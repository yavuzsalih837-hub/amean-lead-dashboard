import { NextResponse } from 'next/server';

const MAX_PAGES = 4;
const REQUEST_TIMEOUT_MS = 10_000;
const PATHS_TO_TRY = [
  '/contact',
  '/iletisim',
  '/iletişim',
  '/about',
  '/about-us',
  '/hakkimizda',
  '/hakkımızda',
];

function normalizeWebsite(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error('Website is required');
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractEmails(html: string): string[] {
  const matches = html.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? [];
  return dedupe(matches.map((match) => match.toLowerCase()));
}

function extractPhones(html: string): string[] {
  const matches = html.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
  return dedupe(matches.map((match) => match.trim()));
}

function extractSocial(html: string, domain: string): string[] {
  const matches = html.match(new RegExp(`https?:\\/\\/(?:www\\.)?${domain}\\/[^\\s"'<>]+`, 'gi')) ?? [];

  return dedupe(matches.map((match) => match.trim()));
}

async function fetchWithTimeout(url: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return {
      html,
      finalUrl: response.url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const website =
      typeof body?.website === 'string' && body.website
        ? body.website
        : new URL(request.url).searchParams.get('website') ?? '';

    const normalizedWebsite = normalizeWebsite(website);
    const rootUrl = new URL(normalizedWebsite);
    const baseOrigin = `${rootUrl.protocol}//${rootUrl.host}`;

    const urlsToTry = [rootUrl.href];

    for (const path of PATHS_TO_TRY) {
      if (urlsToTry.length >= MAX_PAGES) {
        break;
      }

      const candidateUrl = `${baseOrigin}${path}`;
      if (!urlsToTry.includes(candidateUrl)) {
        urlsToTry.push(candidateUrl);
      }
    }

    const collected = {
      email: null as string | null,
      emails: [] as string[],
      phone: null as string | null,
      phones: [] as string[],
      instagram: null as string | null,
      facebook: null as string | null,
      linkedin: null as string | null,
      sourceUrls: [] as string[],
    };

    for (const url of urlsToTry.slice(0, MAX_PAGES)) {
      try {
        const { html, finalUrl } = await fetchWithTimeout(url);
        const pageEmails = extractEmails(html);
        const pagePhones = extractPhones(html);
        const pageInstagram = extractSocial(html, 'instagram\\.com');
        const pageFacebook = extractSocial(html, 'facebook\\.com');
        const pageLinkedin = extractSocial(html, 'linkedin\\.com');

        if (pageEmails.length > 0 || pagePhones.length > 0 || pageInstagram.length > 0 || pageFacebook.length > 0 || pageLinkedin.length > 0) {
          collected.emails.push(...pageEmails);
          collected.phones.push(...pagePhones);
          if (pageInstagram[0]) {
            collected.instagram = collected.instagram ?? pageInstagram[0];
          }
          if (pageFacebook[0]) {
            collected.facebook = collected.facebook ?? pageFacebook[0];
          }
          if (pageLinkedin[0]) {
            collected.linkedin = collected.linkedin ?? pageLinkedin[0];
          }
          collected.sourceUrls.push(finalUrl);
        }

        if (collected.emails.length > 0 && collected.phones.length > 0 && collected.instagram && collected.facebook && collected.linkedin) {
          break;
        }
      } catch {
        // Skip unreachable pages and continue.
      }
    }

    collected.emails = dedupe(collected.emails);
    collected.phones = dedupe(collected.phones);
    collected.email = collected.emails[0] ?? null;
    collected.phone = collected.phones[0] ?? null;
    collected.sourceUrls = dedupe(collected.sourceUrls);

    return NextResponse.json(collected);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scrape contact information';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
