import { async } from 'regenerator-runtime';
import { API_URL } from './config';
import { RESULTS_PER_PAGE, KEY } from './config';
import { getJSON, sendJSON } from './helpers';

export const state = {
  recipe: {},
  search: { query: '', results: [], page: 1, resultsPerPage: RESULTS_PER_PAGE },
  bookmarks: [],
};

export async function loadRecipe(id) {
  const data = await getJSON(`${API_URL}${id}?key=${KEY}`);
  // console.log(data);
  const { recipe } = data.data;

  state.recipe = {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };

  if (state.bookmarks.some((bookmark) => bookmark.id === id))
    state.recipe.bookmarked = true;
  else state.recipe.bookmarked = false;
}

export async function loadSearchResults(query) {
  const data = await getJSON(`${API_URL}?search=${query}&key=${KEY}`);

  state.search.query = query;
  state.search.results = data.data.recipes.map((recipe) => {
    return {
      id: recipe.id,
      title: recipe.title,
      publisher: recipe.publisher,
      image: recipe.image_url,
      ...(recipe.key && { key: recipe.key }),
    };
  });
}

export function getSearchResultsPage(page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;

  return state.search.results.slice(start, end);
}

export function updateServings(newServings) {
  state.recipe.ingredients.forEach((ing) => {
    ing.quantity *= newServings / state.recipe.servings;
  });

  state.recipe.servings = newServings;
}

function persistBookmarks() {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
}

export function addBookmark(recipe) {
  state.bookmarks.push(recipe);

  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persistBookmarks();
}

export function deleteBookmark(id) {
  const index = state.bookmarks.findIndex((bookmark) => bookmark.id === id);
  state.bookmarks.splice(index, 1);
  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
}

export async function uploadRecipe(recipe) {
  const ingredients = Object.entries(recipe)
    .filter((entry) => entry[0].startsWith('ingredient') && entry[1] !== '')
    .map((ing) => {
      const ingArr = ing[1].split(',').map((ing) => ing.trim());
      if (ingArr.length !== 3)
        throw new Error(
          'Wrong ingredient format! Please use the correct format'
        );

      const [quantity, unit, description] = ingArr;

      return {
        quantity: quantity ? Number(quantity) : null,
        unit,
        description,
      };
    });

  // console.log(ingredients);

  const newRecipe = {
    title: recipe.title,
    source_url: recipe.sourceUrl,
    image_url: recipe.image,
    publisher: recipe.publisher,
    cooking_time: Number(recipe.cookingTime),
    servings: Number(recipe.servings),
    ingredients,
  };

  // console.log(newRecipe);
  const data = await sendJSON(`${API_URL}?key=${KEY}`, newRecipe);
  // console.log(data);

  const uploadedRecipe = data.data.recipe;
  state.recipe = {
    id: uploadedRecipe.id,
    title: uploadedRecipe.title,
    publisher: uploadedRecipe.publisher,
    sourceUrl: uploadedRecipe.source_url,
    image: uploadedRecipe.image_url,
    servings: uploadedRecipe.servings,
    cookingTime: uploadedRecipe.cooking_time,
    ingredients: uploadedRecipe.ingredients,
    key: uploadedRecipe.key,
  };
  addBookmark(state.recipe);
}

function init() {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
}

init();
