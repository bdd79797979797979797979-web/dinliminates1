
// CP532 meal photo contracts.
const foodPhotoRows=(()=>{const w={};vm.runInNewContext(foods,{window:w});return w.DINLIMINATE_FOODS||[]})();
const foodByName=new Map(foodPhotoRows.map(x=>[x.name,x]));
assert(/shop\.barebells\.com.*salty-peanut-gallery-0-8491550198\.png/i.test(foodByName.get('Protein Bar')?.image||''),'Protein Bar must use the Barebells Salty Peanut bar product image');
assert(/images\.pexels\.com.*pexels-photo-19202817\.jpeg/i.test(foodByName.get('BLT')?.image||''),'BLT must use the refreshed bacon-lettuce-tomato sandwich photo');
assert(/ourstate\.s3\.amazonaws\.com.*FEB25-PE_Cornbread-and-Buttermilk__TimRobison\.jpg/i.test(foodByName.get('Buttermilk & Cornbread')?.image||''),'Buttermilk & Cornbread must use the requested glass-and-cornbread pairing');
assert(/images\.pexels\.com.*pexels-photo-2397401\.jpeg/i.test(foodByName.get('Meatloaf & Mashed Potatoes')?.image||''),'Meatloaf & Mashed Potatoes must use the refreshed Southern-style plate photo');
assert(/commons\.wikimedia\.org.*Soup_beans_and_corn_bread\.jpg/i.test(foodByName.get('Pinto Beans & Cornbread')?.image||''),'Pinto Beans & Cornbread must use the refreshed Southern pairing photo');