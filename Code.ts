// @ts-ignore
import * as Cheerio from 'cheerio';
import MyEnv from './MyEnv';

const NIKKEI_SEARCH_URL = 'https://www.nikkei.com/search';

const main = () => {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();

    const oldArticleUrls: Set<string> = new Set();
    sheet.getRange('A1:A10').getValues().flat().forEach((v) => {
        oldArticleUrls.add(v);
    });

    const newArticleUrls: Set<string> = new Set();
    const newArticleTitles: Map<string, string> = new Map();
    MyEnv.nikkeiSubscribeKeywords.forEach((keyword) => {
        const targetUrl = nikkeiSearchUrl(keyword);

        const contents = UrlFetchApp.fetch(targetUrl).getContentText();
        const $ = Cheerio.load(contents);
        const articleElements = $('div.nui-card__main');
        let articlesUrls: string[] = [];
        articleElements.each((_, article) => {
            const articleTitleElement = $('h3.nui-card__title > a', article).first();
            const articleTitle = articleTitleElement.attr('title');
            const articleUrl = articleTitleElement.attr('href');

            if (!articleTitle) return;
            if (!articleUrl) return;

            newArticleTitles[articleUrl] = articleTitle;

            newArticleUrls.add(articleUrl);
        });

        sheet.getRange('A1:A10').setValues(articlesUrls.map((v) => [v]));

        const textContent = [...newArticleUrls].
            filter(v => !oldArticleUrls.has(v)).
            map(v => `${newArticleTitles[v]}\n${v}`).concat('\n\n');

        if (!textContent) return;

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

const nikkeiSearchUrl = (keyword: string, volume: number = 10): string => {
    return `${NIKKEI_SEARCH_URL}?keyword=${keyword}&volume=${volume}`;
};
