import * as model from './model';
import RecipeView from './views/recipeView';

import 'core-js/stable';
import { async } from 'regenerator-runtime';
import 'regenerator-runtime/runtime';
import SearchView from './views/searchView';
import ResultView from './views/resultsView';
import PaginationView from './views/paginationView';
import BookmarksView from './views/bookmarksView';
import AddRecipeView from './views/addRecipeView';
import recipeView from './views/recipeView';
import { MODAL_CLOSE_SEC } from './config';
import addRecipeView from './views/addRecipeView';

const recipeContainer = document.querySelector('.recipe');

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

async function controlRecipes() {
  try {
    const id = window.location.hash.slice(1);

    if (!id) return;
    RecipeView.renderSpinner();

    await model.loadRecipe(id);
    // const recipe = model.state.recipe;
    RecipeView.render(model.state.recipe);

    // mark the recipe in results
    ResultView.update(model.getSearchResultsPage());
    // BookmarksView.update(model.state.bookmarks);

    // console.log(recipe);
  } catch (err) {
    console.error(err);
    RecipeView.renderError();
  }
}
function controlServings(newServings) {
  model.updateServings(newServings);

  RecipeView.update(model.state.recipe);
}

function controlBookmark() {
  if (model.state.recipe.bookmarked)
    model.deleteBookmark(model.state.recipe.id);
  else model.addBookmark(model.state.recipe);
  RecipeView.update(model.state.recipe);
  BookmarksView.render(model.state.bookmarks);
}

function controlLoadBookmarks() {
  BookmarksView.render(model.state.bookmarks);
}

async function controlSearchResults() {
  try {
    const query = SearchView.getQuery();
    if (!query) return;
    ResultView.renderSpinner();

    await model.loadSearchResults(query);
    ResultView.render(model.getSearchResultsPage(1));
    PaginationView.render(model.state.search);
  } catch (err) {
    ResultView.renderError();
  }
}

function controlPagination(goToPage) {
  ResultView.render(model.getSearchResultsPage(goToPage));
  PaginationView.render(model.state.search);
}

async function controlAddRecipe(recipe) {
  try {
    addRecipeView.renderSpinner();

    await model.uploadRecipe(recipe);

    RecipeView.render(model.state.recipe);
    BookmarksView.render(model.state.bookmarks);

    AddRecipeView.renderMessage();

    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    setTimeout(() => {
      AddRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    console.error(err);
    AddRecipeView.renderError(err.message);
  }
}

// controlSearchResults();
function init() {
  BookmarksView.addHandlerRender(controlLoadBookmarks);
  RecipeView.addHandlerRender(controlRecipes);
  RecipeView.addHandlerServings(controlServings);
  RecipeView.addHandlerBookmark(controlBookmark);
  SearchView.addHandlerSearch(controlSearchResults);
  PaginationView.addHandlerClick(controlPagination);
  AddRecipeView.addHandlerUpload(controlAddRecipe);
}
// console.log([1, 2, 3].find((el) => el > 1));

init();
