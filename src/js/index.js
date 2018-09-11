//274ca655b843656f918d268fff3d1c1f
//http://food2fork.com/api/search
import {elements, renderLoader , clearLoader} from './views/base';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import Search from './models/Search';
import * as searchView from './views/searchVeiw';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';

/*
Global state of the app:
      * - Search obj
      *  - Current recipe obj
      *  - SHoping list obj
      *  - Liked recipes*/
const state = {};



/* Search controller*/

const controlSearch = async () =>{
    //1. get query from the view
    const query = searchView.getInput();
    //const query = 'pizza';
    console.log(query);//todo

    if (query) {
        //2. new search obj and add to state
        state.search = new Search(query);

        //3.Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            //4.Search for recepis
            await state.search.getResults();

            //5. render results on UI
            clearLoader();
            console.log(state.search.result);
            searchView.renderResults(state.search.result)
        }catch (e) {
            alert("Something went wrong with search...");
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e =>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {

    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto , 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        console.log(goToPage);
    }
});

/* Recipe controller*/

const controlRecipe = async() => {
    //get id form th url
    const id = window.location.hash.replace('#', '');

    if(id){
        //prepare ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if (state.search) {
            searchView.highLightedSelected(id);
        }
        //create new recipe obj
        state.recipe = new Recipe(id);

        try{
            //get recipe data and parse ingredients
            await state.recipe.getRecipe();

            state.recipe.parseIngredients();
            console.log(state.recipe.ingredients);

            //calculate serving and time
            state.recipe.calcServings();
            state.recipe.calcTime();
            //render recipe

            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        }catch (e) {
            console.log(e);
            alert('Error processing recipe')
        }
    }
}

// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/* List controller*/
const controlList = () => {
    //create new list if there is none yet
    if (!state.list) state.list = new List();

    //add ingredient to the list an ui
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderIten(item);
    });
};

//handle delete and update list item events
elements.shoping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    console.log(id);

    //handle delete btn
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete from state
        state.list.deleteItem(id);
        //delete from ui
        listView.deleteItem(id);

        //handle update value
    }else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/* Like controller*/

const controllLike = ()=>{
    if(!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id;
    //user has not liked current recipe
    if (!state.likes.isLiked(currentId)) {
        //add like to state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle like button
        likesView.toggleLikeBtn(true);

        //add like to the ui list
        likesView.renderLike(newLike);
        console.log(state.likes);
        //user has not liked current recipe
    }else {

        //remove like to state
        state.likes.deleteLike(currentId);
        //toggle like button
        likesView.toggleLikeBtn(false);
        //remove like to the ui list
        likesView.renderLike(currentId);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//restore liked recipes on page load

window.addEventListener('load', ()=>{
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();

    //toggle like menu
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})


//handling recipe button clicks
elements.recipe.addEventListener('click', e => {

    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        //decrease btn is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe)
        }
    }else if (e.target.matches('.btn-increase, .btn-increase *')) {
        //increase btn is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe)
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //add ingredients to shopping list
        controlList()
    }else if (e.target.matches('.recipe__love, .recipe__love *')) {
        //like controller
        controllLike();
    }
});
