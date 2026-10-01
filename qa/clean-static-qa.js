assert(!app.includes("document.createElement('style')"),'app should not construct stylesheet builders');
assert(app.includes("S.winnerType"),'winner type must be persisted explicitly');
assert(app.includes("const DEFAULT_FOOD_IMAGE = 'https://images.pexels.com/photos/16365767/pexels-photo-16365767.jpeg?auto=compress&cs=tinysrgb&w=1800';"),'Added meals must have a dedicated default food image.');
assert(app.includes("const photoInput=$('editFoodPhoto').value.trim();") && app.includes("let photo=photoInput||(isEdit&&item?.image?item.image:DEFAULT_FOOD_IMAGE)"),'New meals without a photo should use the default image while edited meals should preserve an existing photo.');
assert(app.includes('else item.image=DEFAULT_FOOD_IMAGE;'),'Missing stored custom photos must recover to the default food image.');
assert(css.includes('#manageFoodsModal .manage-delete'),'Custom meal Delete action must have premium destructive styling');