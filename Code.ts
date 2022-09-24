// @ts-ignore
import * as Cheerio from 'cheerio';
import MyEnv from './MyEnv';

const NIKKEI_ORIGIN = 'https://www.nikkei.com';
const NIKKEI_SEARCH_URL = `${NIKKEI_ORIGIN}/search`;
const NIKKEI_SEARCH_VOLUME = 10;

const main = () => {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();

    const oldArticleUrlSet: Set<string> = new Set(
        sheet.getRange('A1:A10').getValues().flat()
    );

    const newArticleUrlSet: Set<string> = new Set();
    const newArticleTitles: Map<string, string> = new Map();
    MyEnv.nikkeiSubscribeKeywords.forEach((keyword) => {
        const targetUrl = nikkeiSearchUrl(keyword, NIKKEI_SEARCH_VOLUME);

        const contents = UrlFetchApp.fetch(targetUrl).getContentText();
        const $ = Cheerio.load(contents);
        const articleElements = $('div.nui-card__main');
        articleElements.each((i, article) => {
            if (i > NIKKEI_SEARCH_VOLUME) return;

            const articleTitleElement = $('h3.nui-card__title > a', article).first();
            const articleTitle = articleTitleElement.attr('title');
            const articlePath = articleTitleElement.attr('href');

            if (!articleTitle) return;
            if (!articlePath) return;

            const articleUrl = NIKKEI_ORIGIN + articlePath;

            newArticleTitles[articleUrl] = articleTitle;
            newArticleUrlSet.add(articleUrl);
        });

        const newSheetValues: string[] = (new Array(NIKKEI_SEARCH_VOLUME)).fill('');
        Array.from(newArticleUrlSet.values()).
            slice(0, NIKKEI_SEARCH_VOLUME).
            forEach((v, i) => {
                newSheetValues[i] = v;
            });

        sheet.getRange(`A1:A${NIKKEI_SEARCH_VOLUME}`).
            setValues(newSheetValues.map((v) => [v]));

        const textContent = Array.from(newArticleUrlSet.values()).
            filter(v => !oldArticleUrlSet.has(v)).
            map(v => `${newArticleTitles[v]}\n${v}`).
            join('\n\n');

        if (!textContent.trim()) return;

        Logger.log('Will post this text');
        Logger.log(textContent);

        UrlFetchApp.fetch(MyEnv.discordWebhookUrl, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify({
                content: textContent
            })
        });
    });
};

const nikkeiSearchUrl = (keyword: string, volume: number = NIKKEI_SEARCH_VOLUME): string => {
    return `${NIKKEI_SEARCH_URL}?keyword=${keyword}&volume=${volume}`;
};
