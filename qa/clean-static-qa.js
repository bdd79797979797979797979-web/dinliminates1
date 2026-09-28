const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('app.js','utf8'),foods=fs.readFileSync('data/foods.js','utf8'),api=fs.readFileSync('api/restaurants.js','utf8');
new vm.Script(foods);new vm.Script(app);new vm.Script(api);
for(const s of ['what sounds good tonight?','Choose a food','Find a restaurant','foodPassAround','restaurantPassAround','foodCut','foodMaybe','foodBack','foodHide','randomOne','Continue saved round'])assert(html.includes(s),'missing HTML contract: '+s);
for(const s of ['restaurantFiltered','cleanSearch','cleanLocate','restaurantBackUndo','applyFoodCut','applyFoodMaybe','passSetup','passVote','passUndo'])assert(app.includes(s),'missing app contract: '+s);
for(const s of ['fast_food','restaurant','mode=search','mode=suggest','mode=resolve','mode=reverse'])assert(api.includes(s),'missing API contract: '+s);
for(const s of ['Mexican Stir Fry','Meatloaf & Mashed Potatoes','Beef Stroganoff','Fried Rice','Pot Roast','Pork Chops'])assert(foods.includes(s),'missing food data: '+s);
console.log('Dinliminate clean static QA: PASS');
console.log('HTML bytes:',html.length,'APP bytes:',app.length,'FOODS bytes:',foods.length,'API bytes:',api.length);