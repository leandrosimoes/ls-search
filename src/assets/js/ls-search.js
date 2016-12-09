; (function (window, document) {
    "use strict";

    var eventsTrigger = [],
        eventsTriggered = 0,
        forceStop = false,
        LsPriorities = [],
        LsFilter,
        filtering,
        timeout;

    function isFunction(o) {
        return typeof o == 'function';
    };

    function stringFormat(args) {
        var str = this;

        if (!str || !args || typeof str != 'string') return str;

        for (var i = 0; i < args.length; i++) {
            str = str.replace('{' + i + '}', args[i]);
        }

        return str;
    };

    function validateOptions(options) {
        var defineMessage = 'You must define "{0}" options of "{1}" engine.',
            defineMustBeFun = 'The "{0}" option of "{1}" engine must be a function.',
            defineOneOfMessage = 'You must define "{0}" or "{1}" options of engine "{2}".',
            defineBothMessage = 'You cannot define both "{0}" and "{1}" options of engine "{2}".';

        if (!options) {
            throw 'You forget to define the "options", please, see the docs for more information.';
        }

        if (!options.element) {
            throw 'You must define "element" options.';
        }

        if (!options.engines || options.engines.length > 0) {
            for (var i = 0; i < options.engines.length; i++) {
                var eng = options.engines[i];

                if (!eng.name) {
                    throw 'All engines must have the "name" options defined.';
                }

                if (!eng.template) {
                    throw 'All engines must have the "template" options defined.';
                }

                if (!eng.url) {
                    throw defineOneOfMessage.stringFormat(['url', 'data', eng.name]);
                }

                if (!eng.formatResult) {
                    throw defineBothMessage.stringFormat(['formatResult', eng.name])
                }

                if (!isFunction(eng.formatResult)) {
                    throw defineMustBeFun.stringFormat(['formatResult', eng.name]);
                }
            }
        } else {
            throw 'You must define at least one search engine.';
        }
    };

    function jsonToURI(obj) {
        return Object.keys(obj).map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
        }).join('&');
    };

    var extend = function () {

        // Variables
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if a deep merge
        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    // If deep merge and property is an object, merge properties
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = extend(true, extended[prop], obj[prop]);
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for (; i < length; i++) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;

    };

    function ajax(options) {
        var oReq = new XMLHttpRequest(),
            method = options.method || 'GET',
            url = options.url || '',
            callback = options.callback || function (result) { console.log(result); },
            params = options.params || {},
            async = true,
            template = options.template || '';

        if (!url) {
            throw "You must define the url options to make an AJAX request."
        }

        params = extend(params, { term: options.term });

        oReq.onreadystatechange = function () {
            if (oReq.readyState == 4 && oReq.status == 200 && !forceStop) {
                document.dispatchEvent(new Event('ls-search.endevent'));

                var container = document.getElementsByClassName('ls-search-results-container')[0],
                    innerTemplate = document.createElement('div');

                innerTemplate.className = "ls-search-item";

                innerTemplate.appendChild(parseHtml(template));
                container.appendChild(innerTemplate);

                callback(oReq.responseText);
            }

            if (forceStop) {
                eventsTriggered = 0;
            }
        };

        if (method === 'GET') {
            url += ('?' + jsonToURI(params));
        }

        oReq.open(method, url, async);
        oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        oReq.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        oReq.send(JSON.stringify(params));
    };

    //http://krasimirtsonev.com/blog/article/Revealing-the-magic-how-to-properly-convert-HTML-string-to-a-DOM-element
    function parseHtml(html) {
        var wrapMap = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            legend: [1, "<fieldset>", "</fieldset>"],
            area: [1, "<map>", "</map>"],
            param: [1, "<object>", "</object>"],
            thead: [1, "<table>", "</table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            body: [0, "", ""],
            _default: [1, "<div>", "</div>"]
        };
        wrapMap.optgroup = wrapMap.option;
        wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
        wrapMap.th = wrapMap.td;
        var match = /<\s*\w.*?>/g.exec(html);
        var element = document.createElement('div');
        if (match != null) {
            var tag = match[0].replace(/</g, '').replace(/>/g, '').split(' ')[0];
            if (tag.toLowerCase() === 'body') {
                var dom = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
                var body = document.createElement("body");
                // keeping the attributes
                element.innerHTML = html.replace(/<body/g, '<div').replace(/<\/body>/g, '</div>');
                var attrs = element.firstChild.attributes;
                body.innerHTML = html;
                for (var i = 0; i < attrs.length; i++) {
                    body.setAttribute(attrs[i].name, attrs[i].value);
                }
                return body;
            } else {
                var map = wrapMap[tag] || wrapMap._default, element;
                html = map[1] + html + map[2];
                element.innerHTML = html;
                // Descend through wrappers to the right content
                var j = map[0] + 1;
                while (j--) {
                    element = element.lastChild;
                }
            }
        } else {
            element.innerHTML = html;
            element = element.lastChild;
        }
        return element;
    };

    function setEnginesEvents(element, engines) {
        if (!element || !engines || engines.length === 0) return;

        for (var i = 0; i < engines.length; i++) {
            var eng = engines[i];

            eventsTrigger.push(engines[i]);
            document.createEvent('Event').initEvent(engines[i].name, true, true);
            document.addEventListener(engines[i].name, function (e) {
                ajax({
                    method: e.detail.method,
                    url: e.detail.url,
                    callback: e.detail.formatResult,
                    params: e.detail.params,
                    async: e.detail.async,
                    template: e.detail.template,
                    term: element.value
                });
            });
        }
    };

    function clear(preserveFiltering) {
        forceStop = false;

        if (!preserveFiltering) filtering = false;

        var items = document.getElementsByClassName('ls-search-item'),
            qtdItems = items.length - 1;

        if (!!items && qtdItems >= 0) {
            for (var i = qtdItems; i >= 0; i--) {
                items[i].parentNode.removeChild(items[i]);
            }
        }
    };

    function setElementEvents(element, minInputLength) {
        var ele = element,
            divContainer = element.parentNode.getElementsByClassName('ls-search-container')[0];

        document.createEvent('Event').initEvent('ls-search.opensearch', true, true);
        document.createEvent('Event').initEvent('ls-search.closesearch', true, true);
        document.createEvent('Event').initEvent('ls-search.endevent', true, true);

        ele.addEventListener('ls-search.opensearch', function (e) {
            if (document.body.parentNode.className.indexOf('nonscroll') == -1) {
                document.body.parentNode.className += ' nonscroll';
            }

            if (!e.target.ls_open) {
                e.target.ls_open = true;
            }

            repositionElement(e.target, true);
        }, false);

        ele.addEventListener('ls-search.closesearch', function (e) {
            document.body.parentNode.className = document.body.parentNode.className.replace(' nonscroll', '');

            if (!!e.target.ls_open) {
                e.target.ls_open = false;
            }

            if (!filtering) e.target.value = '';

            repositionElement(ele);

            clear(!!filtering);
        }, false);

        document.addEventListener('ls-search.endevent', function (e) {
            if ((eventsTriggered - 1) === 0) {
                ele.parentNode.getElementsByClassName('ls-search-container')[0].className = 'ls-search-container has-result';
            }

            eventsTriggered--;
        });

        document.addEventListener('click', function (e) {
            e.stopPropagation();
            ele.dispatchEvent(new Event('ls-search.closesearch'))
        });

        document.addEventListener('blur', function (e) {
            e.stopPropagation();
            ele.dispatchEvent(new Event('ls-search.closesearch'))
        });

        ele.addEventListener('click', function (e) {
            e.stopPropagation();
            ele.dispatchEvent(new Event('ls-search.opensearch'))
        }, false);

        ele.addEventListener('focus', function (e) {
            e.stopPropagation();
            ele.dispatchEvent(new Event('ls-search.opensearch'))

            clear(!!filtering);
        }, false);

        ele.addEventListener('keyup', function (e) {
            var el = ele;

            clearTimeout(timeout);

            if (!el.value) {
                if (!!filtering && !!LsFilter && typeof LsFilter == 'function') {
                    filtering = false;

                    LsFilter();
                }

                ele.dispatchEvent(new Event('ls-search.closesearch'));
                forceStop = true;
                return;
            }

            if (el.value.length < minInputLength) {
                if (!!filtering && !!LsFilter && typeof LsFilter == 'function') {
                    filtering = false;

                    LsFilter();
                }

                forceStop = true;
                clear();
                return;
            }

            switch ((e.keyCode ? e.keyCode : e.which)) {
                case 27: // Esc
                case 37: // Left Arrow
                case 38: // Up Arrow
                case 39: // Right Arrow
                case 40: // Down Arrow
                    break;
                default:

                    timeout = setTimeout(function () {
                        clear();

                        el.parentNode.getElementsByClassName('ls-search-container')[0].className = 'ls-search-container searching';

                        if (!!LsPriorities && LsPriorities.length > 0) {

                            var orderPriorities = function (engines, priorities) {
                                var orderedArray = [];

                                for (var i = 0; i < priorities.length; i++) {
                                    var filtered = engines.filter(function (obj) {
                                        if (obj.name !== undefined && typeof (obj.name) === 'string') {
                                            return obj.name === priorities[i];
                                        } else {
                                            return false;
                                        }
                                    });

                                    if (!!filtered && filtered.length > 0) {
                                        for (var j = 0; j < filtered.length; j++) {
                                            orderedArray.push(filtered[j]);
                                        }
                                    }
                                }

                                for (var k = 0; k < engines.length; k++) {
                                    if (orderedArray.indexOf(engines[k]) == -1) {
                                        orderedArray.push(engines[k]);
                                    }
                                }

                                return orderedArray;
                            };

                            eventsTrigger = orderPriorities(eventsTrigger, LsPriorities);

                        }

                        for (var i = 0; i < eventsTrigger.length; i++) {
                            var doit = !LsPriorities || LsPriorities.length === 0 || LsPriorities.indexOf(eventsTrigger[i].name) > -1;

                            if (doit) {
                                var customEvent = new CustomEvent(eventsTrigger[i].name, {
                                    detail: eventsTrigger[i]
                                });

                                document.dispatchEvent(customEvent);
                                eventsTriggered++;
                            }
                        }

                        filtering = (!!LsFilter && typeof LsFilter == 'function');

                        filtering && LsFilter(el.value);
                    }, 500);

            }


        }, false);

        divContainer.addEventListener('click', function (e) {
            e.stopPropagation();
        }, false);
    };

    function createSearchContainer(element) {
        var divContainer = document.createElement('div'),
            divDefaultInner = document.createElement('div'),
            textDefault = document.createTextNode('Hi! How can I help you?'),
            divSearching = document.createElement('div'),
            textSearching = document.createTextNode('Searching...'),
            divResultsContainer = document.createElement('div');

        divContainer.className = 'ls-search-container ls-search-hidden';
        divDefaultInner.className = 'ls-search-default';
        divSearching.className = 'ls-search-searching';
        divResultsContainer.className = 'ls-search-results-container';

        divDefaultInner.appendChild(textDefault);
        divSearching.appendChild(textSearching);

        divContainer.appendChild(divDefaultInner);
        divContainer.appendChild(divSearching);
        divContainer.appendChild(divResultsContainer);

        element.parentNode.insertBefore(divContainer, element);
    };

    function repositionElement(element, show) {
        var divContainer = element.parentNode.getElementsByClassName('ls-search-container')[0];
        divContainer.style.top = (element.clientHeight + element.offsetTop + element.clientTop) + 'px';
        divContainer.style.left = (element.clientLeft + element.offsetLeft - 2) + 'px';
        divContainer.style.width = element.offsetWidth + 'px';

        if (!!show) {
            divContainer.className = 'ls-search-container';
        } else {
            divContainer.className = 'ls-search-container ls-search-hidden';
        }
    };

    var ls_search = function (options) {
        validateOptions(options);

        var _ls_search = {
            element: options.element,
            engines: options.engines,
            minInputLength: options.minInputLength || 1,
            setPriorities: function (priorities) {
                if (priorities.constructor !== Array) {
                    throw 'The priorities value must be an Array';
                }

                if (!!priorities && priorities.length > 0) {
                    LsPriorities = [];

                    for (var i = 0; i < priorities.length; i++) {
                        LsPriorities.push(priorities[i]);
                    }
                }

                return this;
            },
            getPriorities: function () {
                return LsPriorities;
            },
            clearPriorities: function () {
                LsPriorities = [];

                return this;
            },
            setFilter: function (filterFunction) {
                if (!filterFunction || typeof filterFunction != 'function') {
                    throw 'The filter must be a function';
                }

                LsFilter = filterFunction;

                return this;
            },
            getFilters: function () {
                return LsFilters;
            },
            clearFilter: function () {
                if (!!LsFilter && typeof LsFilter == 'function') {
                    LsFilter();
                }

                LsFilter = null;

                return this;
            },
            go: function (term) {
                if (!!term && term.length >= _ls_search.minInputLength) {
                    _ls_search.element.value = term;
                    _ls_search.element.dispatchEvent(new Event('keyup'));
                }

                return this;
            },
            close: function (e) {
                this.element.dispatchEvent(new Event('ls-search.closesearch'));

                return this;
            }
        };

        if (!_ls_search.element.ls_seach) {
            _ls_search.element.ls_search = function () {
                ls_search(options);
            };

            createSearchContainer(_ls_search.element);
            setElementEvents(_ls_search.element, _ls_search.minInputLength);
            setEnginesEvents(_ls_search.element, _ls_search.engines);
        }

        options.element.ls_search = _ls_search;
    };

    String.prototype.stringFormat = stringFormat;

    window.ls_search = ls_search
})(window, document);