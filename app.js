 appToast('Fill in Calories, Protein, Carbs, Fat, and Sodium.');
 return;
}
const nutrition=nutritionValues;
const ingredients=String($('editFoodIngredients').value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const photoInput=$('editFoodPhoto').value.trim();
let photo=photoInput||(isEdit&&item?.image?item.image:DEFAULT_FOOD_IMAGE), recipe=$('editFoodRecipe').value.trim();
if(!name)return;
if(isEdit){