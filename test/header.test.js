//const puppeteer = require('puppeteer');
const Page = require('./helpers/page');

let page;

beforeEach(async () => {

    page = await Page.build();
    await page.goto('http://localhost:3000');
})

afterEach(async () => {
  await page.close();
})

test('The header has the correct text', async () => {

    //const text = await page.$eval('a.brand-logo', el => el.innerHTML);
    const text = await page.getContentsOff('a.brand-logo');
    expect(text).toEqual('Blogster');
});

test('Clicking Login starts oAuth Flow', async () => {
  await page.click('.right a');

  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
})

test('When Signed in, shows logout button', async () => {

  await page.login();
  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
  expect(text).toEqual('Logout');
});
