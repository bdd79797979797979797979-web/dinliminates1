assert.deepEqual(requestedCatalog['meatball-subs'].quickCuts,['Italian'],'Meatball Sub should be associated with Italian');
assert.deepEqual(requestedCatalog['sausage-peppers'].quickCuts,['Italian'],'Sausage & Peppers should be associated with Italian');
for(const id of ['spaghetti','pasta-alfredo','lasagna','chicken-parmesan']){
 const row=await page.evaluate(id=>window.DINLIMINATE_FOODS.find(x=>x.id===id),id);
 assert.deepEqual([...new Set(row?.quickCuts||[])].sort(),['Italian','Pasta'],id+' should be associated with Pasta + Italian');
}
const liver=await page.evaluate(()=>window.DINLIMINATE_FOODS.find(x=>x.id==='liver-and-onions'));
assert.deepEqual(liver?.quickCuts,['Southern','Healthy'],'Liver & Onions should be Southern + Healthy');