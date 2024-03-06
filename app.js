const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: [ '--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox', '--no-zygote' ] });
    });
    const page = await browser.newPage();
    const url = 'https://books.toscrape.com/';
    await page.goto(url);
    await page.waitForSelector('.product_pod');

    const data = await scrapeData(page);
    fs.writeFile('data.json', JSON.stringify(data, null, 2), (err) => {
        if (err) throw err;
        console.log('Data has been written to data.json');
    }
    );


    await browser.close();
})();

async function scrapeData(page) {
    let data = [];
    let hasNextPage = true;
    while (hasNextPage) {
        const newData = await page.evaluate(() => {
            const productProducts = document.querySelectorAll('.product_pod');
            const links = [];
            const changeRatingToNumber = (rating) => {
                let newRating = 0;
                switch (rating) {
                    case 'One':
                        newRating = 1;
                        break;
                    case 'Two':
                        newRating = 2;
                        break;
                    case 'Three':
                        newRating = 3;
                        break;
                    case 'Four':
                        newRating = 4;
                        break;
                    case 'Five':
                        newRating = 5;
                        break;
                    default:
                        break;
                }
                return newRating;
            };
            const ChangeStockToBoolean = (stock) => {
                let newStock = false;
                if (stock === 'In stock') {
                    newStock = true;
                }
                return newStock;
            };
            productProducts.forEach(product => {
                links.push({
                    title: product.querySelector('h3 a').title,
                    price: product.querySelector('.price_color').innerText,
                    rating: changeRatingToNumber(product.querySelector('p').classList[1]),
                    image: product.querySelector('img').src,
                    inStock: ChangeStockToBoolean(product.querySelector('.instock.availability').innerText.trim()),
                });
            });
            return links;
        });

        data = data.concat(newData);

        const nextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('.next > a');
            if (nextButton) {
                return nextButton.href;
            } else {
                return null;
            }
        });

        if (nextPage) {
            await page.goto(nextPage);
            await page.waitForSelector('.product_pod');
        } else {
            hasNextPage = false;
        }
    }
    return data;
}
