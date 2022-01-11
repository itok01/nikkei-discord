// @ts-ignore
import * as Cheerio from 'cheerio';
import MyEnv from './MyEnv';

const NIKKEI_SEARCH_URL = 'https://www.nikkei.com/search';

const main = () => {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();

    const oldArticleUrls: string[] = sheet.getRange('A1:A10').getValues().flat();

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

            articlesUrls.push(articleUrl);

            if (!oldArticleUrls.includes(articleUrl)) {
                Logger.log(`Title: ${articleTitle}`);
                Logger.log(`URL: ${articleUrl}`);

                UrlFetchApp.fetch(MyEnv.discordWebhookUrl, {
                    method: 'post',
                    contentType: 'application/json',
                    payload: JSON.stringify({
                        content: `${articleTitle}\n${articleUrl}`
                    })
                });
            }
        });

        sheet.getRange('A1:A10').setValues(articlesUrls.map((v) => [v]));
    });
};

const nikkeiSearchUrl = (keyword: string, volume: number = 10): string => {
    return `${NIKKEI_SEARCH_URL}?keyword=${keyword}&volume=${volume}`;
};
