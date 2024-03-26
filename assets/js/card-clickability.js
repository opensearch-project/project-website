((opensearch) => {

    /**
     * Sets the `style.cursor` property to 'pointer' to one or more DOM elements.
     * @param {string} elementSelector A string defining a DOM query selector that identifies the target document Node list.
     */
    function addPointerCursor(elementSelector) {
        const elements = document.querySelectorAll(elementSelector);
        elements.forEach((element) => {
            if (element.style.cursor !== 'pointer') {
                element.style.cursor = 'pointer';
            }
        });
    }

    /**
     * Returns a DOM element that semantically identifies the root element of a Card component begining from a given reference
     * DOM element. Which type of variant of Card component is indicated by the value of the `cardClassName` parameter.
     * If the Card component boundary cannot be located then `null` is returned.
     * @param {HTMLElement} element A reference to a DOM element from which to begin recursively searching for the card component boundary. 
     * @param {string} cardClassName A string defining the classname of the Card component.
     * @returns {HTMLElement|null}
     */
    function findParentCardBoundary(element, cardClassName) {
        if (element === null) {
            return null;
        } else if (element.classList.contains(cardClassName)) {
            return element;
        } else {
            return findParentCardBoundary(element.parentElement, cardClassName);
        }
    }

    /**
     * Returns a reference to an anchor element within the referenced Card element, or null if none is defined.
     * @param {HTMLElement} cardElement A reference to a DOM element for a Card component.
     * @returns {HTMLAnchorElement|null}
     */
    function findCardLink(cardElement) {
        const link = cardElement.querySelector('a');
        return link;
    }

    /**
     * Clears the '__focused' modified BEM CSS class name from a NodeList of Card components selectable by using
     * the `cardSelector` parameter.
     * @param {string} cardSelector A string defining a DOM query selector for finding a NodeList of Card components.
     * @param {string} cardClassname A string defining a BEM CSS class name whose value will be modified with '__focused'.
     */
    function clearFocusClassFromCards(cardSelector, cardClassname) {
        const cardList = document.querySelectorAll(cardSelector);
        const focusClassName = `${cardClassname}__focused`;
        cardList.forEach((card) => {
            if (card.classList.contains(focusClassName)) {
                card.classList.remove(focusClassName);
            }
        });
    }

    /**
     * Add the '__focused' modifier to the BEM CSS class name for the Card component referenced by the `cardElement` parameter.
     * @param {HTMLElement} cardElement A reference to a Card component DOM element to add the focused state.
     * @param {string} cardClassName A string defining the base BEM CSS class name for the Card component.
     */
    function addFocusClassToCard(cardElement, cardClassName) {
        const focusClassName = `${cardClassName}__focused`;
        cardElement?.classList?.add?.(focusClassName);
    }

    /**
     * Removes the '__active' modifier BEM CSS class name from a collection of Card components effectively removing
     * the "active" state from a perspective of user experience interactivity.
     * @param {string} cardSelector A string defining a DOM query selector for finding a NodeList of Card components.
     * @param {string} cardClassName A string defining a Card component BEM CSS class name.
     */
    function clearActiveClassFromCards(cardSelector, cardClassName) {
        const cardList = document.querySelectorAll(cardSelector);
        const activeClassName = `${cardClassName}__active`;
        cardList.forEach((card) => {
            if (card.classList.contains(activeClassName)) {
                card.classList.remove(activeClassName);
            }
        });
    }

    /**
     * Adds the '__active' modifier BEM CSS class name to a Card component effectively changing the state
     * of a Card to "active" from a perspective of user experience interactivity.
     * @param {HTMLElement} cardElement A reference to a Card component DOM element.
     * @param {string} cardClassName A string defining a Card component BEM CSS class name.
     */
    function addActiveClassToCard(cardElement, cardClassName) {
        const activeClassName = `${cardClassName}__active`;
        cardElement?.classList?.add?.(activeClassName);
    }

    /**
     * Mouse click handler for a Card component. Using the `cardContainerSelector` DOM query selector to define 
     * the scope for a collection of Card components, all Cards will be cleared of their "active" state before
     * setting the "active" state on the `target` Card referenced in the MouseEvent event data, and the Card's
     * nested anchor element will have its `click` event invoked, if the Card is the type of Card that links
     * to some other content.
     * From a perspective of interactivity user experience this allows the Card in its entirety to be clickable / tapable
     * to perform the action of linking to whatever content is referenced by the Card.
     * @param {string} cardContainerSelector A string defining a DOM query selector identifying the container of a collection of Card components.
     * @param {string} cardClassName A string defining a Card component BEM CSS class name.
     * @param {MouseEvent} e Mouse click event object.
     */
    function onCardClick(cardContainerSelector, cardClassName, e) {
        const card = findParentCardBoundary(e.target, cardClassName);
        const cardSelector = `${cardContainerSelector} .${cardClassName}__active`;
        clearActiveClassFromCards(cardSelector, cardClassName);
        addActiveClassToCard(card, cardClassName);
        if (e.target.tagName === 'A') {
            e.stopImmediatePropagation();
            return;
        }
        if (card) {
            const link = findCardLink(card);
            link.click();
            event.stopPropagation();
        }
    }

    /**
     * Card keyboard focus event handler for types of Cards that contains elements that can receive keyboard focus.
     * @param {string} cardContainerSelector A string identifying a DOM query selector used to find an element that contains a set of Card components.
     * @param {string} cardClassname A string defining a Card component BEM CSS class name.
     * @param {FocusEvent} e Focus event data object.
     */
    function onLinkFocus(cardContainerSelector, cardClassname, e) {
        const card = findParentCardBoundary(e.target, cardClassname);
        if (card?.classList?.contains?.(`${cardClassname}__focused`)) {
            return;
        }
        const cardSelector = `${cardContainerSelector} .${cardClassname}`;
        clearFocusClassFromCards(cardSelector, cardClassname);
        addFocusClassToCard(card, cardClassname);
    }

    /**
     * Removes the "focused" state from the card identified by the event `target`.
     * @param {string} cardClassname A string defining a Card BEM CSS class name.
     * @param {FocusEvent} e Focus event data object.
     */
    function onLinkUnFocus(cardClassname, e) {
        const card = findParentCardBoundary(e.target, cardClassname);
        const focusClassName = `${cardClassname}__focused`;
        if (!card?.classList?.contains?.(focusClassName)) {
            return;
        }
        card.classList.remove(focusClassName);
    }

    /**
     * Enhances a collection of Card components with interactive states "focused", "active", and makes the card as a whole
     * clickable to invoke its nested anchor element. The event handlers in this module mechanically manage which modifier
     * version of BEM CSS class names, using a given base class name for different types of Card components. For example,
     * when a Card accepts keyboard focus the focused state will be enabled by adding the "__focused" modifier for a given
     * Block-Element CSS class name. Similarly for "active". Consider a fictional CSS Card class name of "foo-card". When 
     * the Card receives keyboard focus the Card's class list would be augmented with a class name "foo-card__focused", etc.
     * The returned Promise is resolved with an informative string. The function returns a Promise since it is possible
     * that the request to enhance a set of Cards can occur at differnt places within an assembled Jekyll page, as well
     * as dynamically at run time.
     * 
     * @param {string} cardContainerSelector A string defining a DOM query selector identifying a Card set containing element.
     * @param {string} cardClassname A string defining a Card BEM CSS class name.
     * @returns {Promise<string>}
     */
    function makeCardsClickable(cardContainerSelector, cardClassname) {
        return new Promise((resolve) => {
            const performCardStateEnhancements = () => {
                const cardSelector = `${cardContainerSelector} .${cardClassname}`;
                addPointerCursor(cardSelector);
                document.querySelectorAll(cardContainerSelector).forEach(cardList => {
                    cardList.addEventListener('click', onCardClick.bind(null, cardContainerSelector, cardClassname));
                    cardList.addEventListener('focusin', onLinkFocus.bind(null, cardContainerSelector, cardClassname));
                    cardList.addEventListener('focusout', onLinkUnFocus.bind(null, cardClassname));
                });
                resolve(`Initialization of ${cardSelector} cards has been executed`);
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', performCardStateEnhancements);
            } else {
                performCardStateEnhancements();
            }
        });
    }

    // Decorate the opensearch namespace with the `makeCardsClickable` function if it is not already defined.
    if (!opensearch.makeCardsClickable) {
        opensearch.makeCardsClickable = makeCardsClickable;
    }

    // If the _includes/card-clickability.html include has pushed configurations onto the stack
    // during "loading" document readyState then process those here.
    if (opensearch.cardClickabilityIncludeConfigStack?.length) {
        opensearch.cardClickabilityIncludeConfigStack.forEach(cardConfig => {
            const {
                cardContainerSelector,
                cardClassName,
            } = cardConfig;
            makeCardsClickable(cardContainerSelector, cardClassName).then(console.log);
        });
        opensearch.cardClickabilityIncludeConfigStack = null;
        delete opensearch.cardClickabilityIncludeConfigStack;
    }

})(window.opensearch || (window.opensearch = {}));
