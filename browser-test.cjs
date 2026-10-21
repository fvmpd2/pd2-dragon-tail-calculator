const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PD2_BROWSER_PATH?{executablePath:process.env.PD2_BROWSER_PATH}:{})});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
  async function healthy(){
   assert(await page.locator('#error').isHidden());
   assert(/\d/.test(await page.locator('#damage').innerText()));
   assert(!/NaN|Infinity|Check inputs/.test(await page.locator('#damage').innerText()));
  }
  await healthy();const original=await page.locator('#damage').innerText();
  await page.locator('details').filter({has:page.locator('input[name="flatMin"]')}).evaluate(e=>e.open=true);
  await page.fill('[name="flatMin"]','10');await healthy();
  assert.equal(await page.inputValue('[name="flatMax"]'),'0');
  assert.notEqual(await page.locator('#damage').innerText(),original);
  const expected=await page.locator('#damage').innerText(),link=page.url();
  await page.goto(link);await healthy();assert.equal(await page.locator('#damage').innerText(),expected);
  await page.locator('details').filter({has:page.locator('input[name="flatMin"]')}).evaluate(e=>e.open=true);
  for(const [min,max]of [['0','20'],['20','5'],['1000','0'],['0','0']]){
   await page.fill('[name="flatMin"]',min);await page.fill('[name="flatMax"]',max);await healthy();
  }
  await page.selectOption('[name="mode"]','manual');await page.fill('[name="manualMin"]','500');
  assert(await page.locator('#error').isVisible());
  await page.selectOption('[name="mode"]','stats');await healthy();
  await page.click('#reset');await healthy();assert.equal(await page.locator('#damage').innerText(),original);
  assert.deepEqual(errors,[]);console.log('Passed: minimum-only bonuses, maximum-only/mixed/crossed ranges, saved links, inactive manual inputs and Reset in a real browser.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
