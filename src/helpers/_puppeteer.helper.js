// import puppeteer from 'puppeteer'

// let browser

// async function initBrowser() {
// 	if (!browser) {
// 		browser = await puppeteer.launch({
// 			headless: true,
// 			ignoreDefaultArgs: ['--disable-extensions'],
// 			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
// 		})
// 		console.log('✅ Puppeteer iniciado!')
// 	}
// }

// function getBrowser() {
// 	if (!browser) {
// 		throw new Error('❌ Puppeteer não foi iniciado!')
// 	}
// 	return browser
// }

// async function closeBrowser() {
// 	if (browser) {
// 		await browser.close()
// 		console.log('🛑 Puppeteer fechado!')
// 	}
// }

// export { initBrowser, getBrowser, closeBrowser }
