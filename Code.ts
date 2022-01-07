// @ts-ignore
import * as Cheerio from 'cheerio';
import MyEnv from './MyEnv';

const NIKKEI_SEARCH_URL = 'https://www.nikkei.com/search?keyword=';

const main = () => {
    const now = new Date(Date.now());

    MyEnv.nikkeiSubscribeKeywords.forEach((keyword) => {
        const targetUrl = nikkeiSearchUrl(keyword);

        const contents = UrlFetchApp.fetch(targetUrl).getContentText();
        const $ = Cheerio.load(contents);
        const articles = $('div.nui-card__main');
        articles.each((_, article) => {
            const articleTitleElement = $('h3.nui-card__title > a', article).first();
            const articleTimeElement = $('a.nui-card__meta-pubdate > time', article).first();
            const articleTitle = articleTitleElement.attr('title');
            const articleUrl = articleTitleElement.attr('href');
            const articlePublishedAt = new Date(Date.parse(articleTimeElement.attr('datetime')));

            if ((now.getTime() - 60) <= articlePublishedAt.getTime()) {
                Logger.log(`Title: ${articleTitle}`);
                Logger.log(`URL: ${articleUrl}`);
                Logger.log(`Datetime: ${articlePublishedAt}`);

                UrlFetchApp.fetch(MyEnv.discordWebhookUrl, {
                    method: 'post',
                    contentType: 'application/json',
                    payload: JSON.stringify({
                        content: `${articleTitle}\n${articleUrl}`
                    })
                });
            }
        });
    });
};

const nikkeiSearchUrl = (keyword: string): string => {
    return NIKKEI_SEARCH_URL + keyword;
};
