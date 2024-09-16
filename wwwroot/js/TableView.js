import { TableRow, ArraySpan, Pagination } from './TableManager.js'

class PaginationView {
    #pagination
    #activePage
    #links

    #onLinkCreate

    #visibleLinks
    #pageAttribute
    #activeClass

    #squashedPagesBeforeActive
    #squashedPagesAfterActive

    /**
     * @param {Pagination} pagination
     * @param {(link: HTMLElement) => {}} onLinkCreate
     */
    constructor(pagination, onLinkCreate, visibleLinks = 2, activeClass = 'active', pageAttribute = 'value') {
        this.#pagination = pagination
        this.#onLinkCreate = onLinkCreate
        this.#pageAttribute = pageAttribute
        this.#activePage = 0
        this.#visibleLinks = visibleLinks
        this.#activeClass = activeClass;

        this.#squashedPagesBeforeActive = this._createLinkInternal('...')
        this.#squashedPagesAfterActive = this._createLinkInternal('...')

        /** @type {HTMLElement[]} */
        const links = []
        this.#links = links

        this.switchToFirst()
    }

    get totalPages() {
        return this.#pagination.totalPages
    }

    get page() {
        return this.#activePage
    }

    /**
     * @param {HTMLElement?} link
     */
    show(link) {
        if (link && 'style' in link) {
            link.style.display = ''
        } else {
            console.log('there\'s no style property')
        }
    }

    /**
     * @param {HTMLElement?} link
     */
    hide(link) {
        if (link && 'style' in link) {
            link.style.display = 'none'
        } else {
            console.log('there\'s no style property')
        }
    }

    switchToNext() {
        this.switchTo(this.#activePage + 1)
    }

    switchToPrevious() {
        this.switchTo(this.#activePage - 1)
    }

    switchToFirst() {
        if (this.totalPages > 0) {
            this.switchTo(1)
        }
    }

    /**
     * @param {number} page
     */
    switchTo(page) {
        if (!this.#pagination.open(page)) {
            return
        }

        const newActive = this.#pagination.page

        this._unsetActive()

        this._updateLinks(page)

        this._setActive(newActive)
    }

    /**
     * @param {number} page
     */
    createLink(page) {
        const link = this._createLinkInternal(page)
        const self = this
        link.onclick = function (event) {
            console.log(`click on`, event.target)
            self._onclick(event)
        }

        if (typeof this.#onLinkCreate === 'function') {
            this.#onLinkCreate(link)
        }

        return link
    }

    /**
     * @param {number} activePage
     * @param {number} pagesCount
     */
    _updateLinks(activePage) {
        const pagesCount = this.totalPages

        const targetPageInvalid = !Number.isInteger(activePage) || activePage < 1 || activePage > pagesCount
        const currentPageInvalid = !Number.isInteger(this.#activePage) || this.#activePage < 1 || this.#activePage > pagesCount

        if (targetPageInvalid) {
            if (currentPageInvalid) {
                this.switchToFirst()
            }

            return
        }

        this._ensureLinks(pagesCount)
        console.log(this.#links)

        this._hideAll()

        const first = this._findLink(1)
        this.show(first)

        this._squashOrShow(1, activePage - this.#visibleLinks, this.#squashedPagesBeforeActive)

        const start = Math.max(1, activePage - this.#visibleLinks)
        const end = Math.min(pagesCount, activePage + this.#visibleLinks)

        for (let i = start; i <= end; i++) {
            this.show(this._findLink(i))
        }

        this._squashOrShow(activePage + this.#visibleLinks, pagesCount, this.#squashedPagesAfterActive)

        const last = this._findLink(pagesCount)
        this.show(last)
    }

    /**
     * @param {number} start
     * @param {number} end
     * @param {HTMLElement} squashed
     */
    _squashOrShow(start, end, squashed) {
        const notPresentedCount = end - start - 1

        if (notPresentedCount >= 2) {
            const startElement = this._findLink(start, end)

            if (startElement) {
                startElement.parentNode.insertBefore(squashed, startElement.nextSibling)
                this.show(squashed)
            }
        }
        else if (notPresentedCount === 1) {
            const singleNotPresented = this._findLink(start + 1)
            this.show(singleNotPresented)
        }
    }

    /**
     * @param {number} count
     */
    _ensureLinks(count) {
        for (let i = this.#links.length + 1; i <= count; i++) {
            const link = this.createLink(i)
            this.#links.push(link)
        }
    }

    _hideAll() {
        this.hide(this.#squashedPagesBeforeActive)
        this.hide(this.#squashedPagesAfterActive)

        for (let i = 0; i < this.#links.length; i++) {
            this.hide(this.#links[i])
        }
    }

    _unsetActive() {
        const prevActivePageLink = this._findLink(this.#activePage)
        prevActivePageLink?.classList.remove(this.#activeClass)
    }

    /**
     * @param {number} link
     */
    _setActive(page) {
        const link = this._findLink(page)
        link?.classList.add(this.#activeClass)

        this.#activePage = page
    }

    /**
     * @param {number} page
     * @return {HTMLElement?}
     */
    _findLink(page) {
        return page <= 0 || page > this.#links.length
            ? null
            : this.#links[page - 1]
    }

    /**
     * @param {Event} event
     */
    _onclick(event) {
        /** @type {HTMLElement} */
        const link = event.target
        const page = +link.getAttribute(this.#pageAttribute)

        if (!Number.isInteger(page) || page <= 0 || page > this.totalPages) {
            return
        }

        this.switchTo(page)
    }

    /**
    * @param {string} content
    */
    _createLinkInternal(content) {
        const link = document.createElement('a')
        link.style.display = 'none'
        link.innerHTML = content
        link.setAttribute(this.#pageAttribute, content)

        return link;
    };
}

const nextPageBtn = document.getElementById('next_page_btn');

/** @type {HTMLTableElement} */
const table = document.getElementById('table')
console.log(table)

const rows = Array.from(table.rows).map(x => new TableRow(x))
console.log(rows)

const arrSpan = new ArraySpan(rows)
const pgn = new Pagination(arrSpan)
const pgnView = new PaginationView(pgn, (link) => {
    nextPageBtn.parentNode.appendChild(link)
    $(nextPageBtn).before(link)
})
