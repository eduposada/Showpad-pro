import axios from 'axios';
import { load } from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export function isAllowedCifraClubUrl(urlString) {
    try {
        const u = new URL(urlString);
        if (u.protocol !== 'https:') return false;
        const h = u.hostname.toLowerCase();
        return h === 'cifraclub.com.br' || h.endsWith('.cifraclub.com.br');
    } catch {
        return false;
    }
}

/**
 * Busca HTML do Cifra Club e extrai título, artista e texto da cifra.
 * @returns {{ title: string, artist: string, content: string }}
 */
export async function scrapeCifraClubUrl(url) {
    if (!url || typeof url !== 'string' || !isAllowedCifraClubUrl(url)) {
        throw Object.assign(new Error('URL inválida. Use apenas links https do Cifra Club.'), { statusCode: 400 });
    }

    const { data } = await axios.get(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        timeout: 9000,
        maxRedirects: 5,
        validateStatus: (s) => s < 500,
    });

    if (typeof data !== 'string' || !data.includes('<')) {
        throw Object.assign(new Error('Resposta inesperada do Cifra Club.'), { statusCode: 502 });
    }

    const $ = load(data);
    let title = $('h1.t1').text().trim() || $('h1').first().text().trim();
    let artist = $('.header-main-subtitle').text().trim() || $('h2.t3').text().trim() || $('.t3').text().trim();

    if (!artist || artist.toLowerCase().includes('cifra club')) {
        $('h2').each((i, el) => {
            const text = $(el).text().trim();
            if (text && !text.toLowerCase().includes('cifra club')) {
                artist = text;
                return false;
            }
        });
    }

    let content = $('pre').first().text().trim();
    if (!content) {
        content = $('pre').text().trim();
    }
    content = content
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/\u00a0/g, ' ');

    if (!content) {
        throw Object.assign(new Error('Não foi possível encontrar a cifra (<pre>) nesta página.'), { statusCode: 422 });
    }

    return {
        title: title || 'Música',
        artist: artist || 'Artista Desconhecido',
        content,
    };
}
