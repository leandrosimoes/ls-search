# ls-search

## What is this?
A multiple search and filter plugin made with pure vanilla javascript with full customizable results layout.


## Hot to install?

 Instal by bower:
 
`bower install ls-search --save`

Or just download and link into your page this assets:

### CSS:
[ls-search.css](https://raw.githubusercontent.com/leandrosimoes/ls-search/master/src/assets/css/ls-search.css)
or
[ls-search.min.css](https://raw.githubusercontent.com/leandrosimoes/ls-search/master/src/assets/css/ls-search.min.css)

### Javascript:
[ls-search.js](https://raw.githubusercontent.com/leandrosimoes/ls-search/master/src/assets/js/ls-search.es5.js)
or
[ls-search.min.js](https://raw.githubusercontent.com/leandrosimoes/ls-search/master/src/assets/css/ls-search.es5.min.js)

## How it works?

### Html search element

```html
<input id="search-sample" type="text" value="" placeholder="Type to search or filter" />
```

### Setup

```javascript
var searchInput = document.getElementById('input-ls-search');

ls_search({
    //input element (required)
    element: document.getElementById('input-ls-search'), 
    // minimum typed keys for search (default: 1)
    minInputLength: 3, 
    // array of "engines", engines are the searches that ls_search will do
    engines: [{ 
        //Name of engine (unique, required)
        name: 'NAMES', 
        // url to search (required)
        // IMPORTANT:
        // If you use a webservice or api to search you must add a 
        // parameter called "term" to receive the string input
        url: 'sample/names.json', 
        // method (default: GET)
        method: 'GET',
        // Template used to show the results (required)
        template: '<div id="template-sample"></div>',
        // Function to format the results and put them on the template (required)
        formatResult: function (result) {}
    }]
});
```

### Methods

```javascript
var searchInput = document.getElementById('input-ls-search');

// Set the priorities of the engines to search in order.
// Omit engines names to ignore them on search
searchInput.ls_search.setPriorities(['DRINKS', 'NAMES', 'FOODS']);

// Return an array with the names of the priorities setted
searchInput.ls_search.getPriorities();

// Clear all priorities
searchInput.ls_search.clearPriorities();

// Set a function to filter any data on the screen
// at the same time that searches by engines
searchInput.ls_search.setFilter(function () { });

// Clear the filter function
searchInput.ls_search.clearFilter();

// Programmatically open and search on all engines and filters
searchInput.ls_search.go('string to search');

// Programmatically close and clear the searches and filters
searchInput.ls_search.close('string to search');
```

## Important
* If you use a webservice or api to search you must add a parameter called "term" to receive the string input.
* You can also download this full repository that contains a working sample page.
* The style of results and the search input it's by your own, ls-search just bring minimum styles for the results container.

## TODO

* Create bower package
* Create nuget package
* Customizable search parameters
* Multiple filters
* Destroy method
* Char countdown on type based on `minInputLength` property

## Contribute

Just send pull requests on `develop` branch

## Sugestions

Open an issue or just mail me on [leandro.simoes@outlook.com](mailto:leandro.simoes@outlook.com)
