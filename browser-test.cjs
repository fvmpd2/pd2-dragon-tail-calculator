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
  await page.locator('details').filter({has:page.locator('#compare')}).evaluate(e=>e.open=true);
  const comparison=label=>page.locator('.improvement').filter({has:page.locator('span').filter({hasText:label})}).locator('strong');
  for(const label of ['+10 minimum damage','+10 maximum damage','+10 Deadly Strike chance'])assert(/\+\d/.test(await comparison(label).innerText()));
  await page.fill('[name="ds"]','75');assert.match(await comparison('+10 Deadly Strike chance').innerText(),/Already at 75% DS cap/);
  await page.locator('details').filter({has:page.locator('[name="maxDs"]')}).evaluate(e=>e.open=true);
  await page.fill('[name="maxDs"]','25');assert(/\+\d/.test(await comparison('+10 Deadly Strike chance').innerText()));
  await page.fill('[name="ds"]','95');assert.match(await page.locator('#compare').innerText(),/Only \+5 points fit before the 100% cap/);
  await page.fill('[name="ds"]','100');assert.match(await comparison('+10 Deadly Strike chance').innerText(),/Already at 100% DS cap/);
  await page.selectOption('[name="mode"]','manual');assert.match(await comparison('+10 minimum damage').innerText(),/Use build-from-stats mode/);
  await page.click('#reset');await healthy();
  await page.selectOption('[name="convictionLevel"]','20');assert.equal(await page.inputValue('[name="conviction"]'),'50');
  await page.selectOption('[name="lowerResLevel"]','20');await page.selectOption('[name="curseMastery"]','20');assert.equal(await page.inputValue('[name="lowerRes"]'),'49');
  const armory={character:{name:'Synthetic test',class:{id:6},level:90,status:{},gold:{character:0,stash:0},attributes:{strength:100,dexterity:200,vitality:100,energy:25},life:500,mana:100,stamina:100,skills:[{id:270,level:20},{id:255,level:20},{id:275,level:20},{id:258,level:5}]},items:[{name:'Boots',base_code:'uhb',base:{type_code:'boot'},quality:{id:2},location:{zone:'Equipped',equipment:'Boots'},modifiers:[{name:'strength',values:[20]}]}]};
  armory.mercenary={type:36,level:90,items:[{name:'Infinity test',base_code:'hax',base:{type_code:'axe'},quality:{id:2},location:{zone:'Equipped',equipment:'Right Hand'},modifiers:[{name:'item_aura',values:[123,12]}]}]};
  await page.locator('#character').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(armory))});
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.startsWith('Character imported'));
  await healthy();assert.equal(await page.inputValue('[name="str"]'),'120');assert.equal(await page.inputValue('[name="level"]'),'20');assert.equal(await page.inputValue('[name="bos"]'),'5');assert.equal(await page.inputValue('[name="convictionLevel"]'),'12');assert.equal(await page.inputValue('[name="conviction"]'),'34');
  await page.locator('#character').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await page.waitForFunction(()=>document.querySelector('#feedback').textContent.startsWith('Import failed'));
  assert.equal(await page.inputValue('[name="str"]'),'120');await healthy();
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('Passed: minimum-only bonuses, maximum-only/mixed/crossed ranges, saved links, inactive manual inputs and Reset in a real browser.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
