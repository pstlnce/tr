/**
 * returns whether value is number or not
 * @pure
 * @param {any} value
 * @returns {value is number}
 */
function isNum(value) {
    return typeof value === 'number' && value !== NaN
}

/**
 * returns whether the value is in range declared by min and maxExclude parameters
 * @pure
 * @param {any} value
 * @param {number} min
 * @param {number} maxExclude
 * @returns {value is number}
 */
function inRange(value, min, maxExclude) {
    return isNum(value) && value >= min && value < maxExclude
}


/** @template T */
export class ArraySpan {
    #values
    #count = 0

    /**
     * @param {T[]} values
     * @param {number?} count
     */
    constructor(values, count = null) {
        if (!Array.isArray(values)) {
            throw new Error('')
        }

        if (count && !inRange(count, 0, values.length + 1)) {
            throw new Error('')
        }

        this.#values = values
        this.#count = count !== null && count !== undefined && count !== NaN
            ? count
            : values.length
    }

    set count(newCount) {
        if (typeof (newCount) === 'number' && newCount !== NaN) {
            this.#count = newCount
        }
    }

    get values() {
        return this.#values
    }

    get count() {
        return this.#count
    }

    get length() {
        return this.#values.length
    }

    at(index) {
        return inRange(index, 0, this.#values.length)
            ? this.#values[index]
            : undefined
    }

    swap(indexFirst, indexSecond) {
        const first = this.rows[indexFirst]

        this.rows[indexFirst] = this.rows[indexSecond]
        this.rows[indexSecond] = first
    }

    push(value) {
        values.push(value)
        this.count += 1
    }

    [Symbol.iterator]() {
        return new ArraySpanEnumerator(this)
    }
}

/** @template {T} */
class ArraySpanEnumerator {
    #source
    #current = 0
    done = true
    value = undefined

    /**
     * @param {ArraySpan<T>} arraySpan
     */
    constructor(arraySpan) {
        this.#source = arraySpan
    }

    next() {
        this.value = undefined
        this.done = this.#current >= this.#source.count

        if (!this.done) {
            this.value = this.#source.at(this.#current)
            this.#current += 1
        }

        return this
    }
}

/**
 * Filter interface
 */
export class Filter {
    #id

    /**
     * id 
     * @param {string} id
     */
    constructor(id) {
        this.#id = id
    }

    /**
     * returns whether value fits or not
     * @template T
     * @param {T} value
     * @returns {boolean}
     */
    isMatch(value) {
        return false
    }

    get id() {
        return this.#id
    }
}

export class RegexFilter extends Filter {
    #template
    #column

    /**
     * @param {string|RegExp} template regex template
     * @param {string} column row's column which value would be used in comparison
     * @param {string?} id custom id
     */
    constructor(template, column, id = null) {
        super(id ?? column)
        this.#template = RegexFilter._ensureRegExp(template)
        this.#column = column
    }

    /**
     * @param {TableRow} tableRow
     */
    isMatch(tableRow) {
        const cellContent = tableRow[this.#column]
        return this.#template.test(cellContent)
    }

    /**
     * @pure
     * @param {string|RegExp} template
     */
    static _ensureRegExp(template) {
        return typeof template === 'string'
            ? new RegExp(template)
            : template
    }

}

export class FiltersSequenceNode {
    #filter
    #id
    #filteredCount

    /**
     * @param {Filter} filter
     */
    constructor(filter) {
        this.#filter = filter
        this.#id = filter.id
        this.#filteredCount = -1
    }

    get id() {
        return this.#id
    }

    get filter() {
        return this.#filter
    }

    get filteredCount() {
        return this.#filteredCount
    }
}

export class FiltersSequence {
    #filters
    #values

    /**
     * @param {ArraySpan<Object<string, any>>} values
     */
    constructor(values) {
        /** @type {FiltersSequenceNode[]} */
        const filters = []
        this.#filters = filters
        this.#values = values
    }

    /**
     * Filters collection
     * @param {Filter} filter
     */
    filter(filter) {
        if (!filter || !(isMatch in filter && typeof isMatch === 'function' && id in filter && typeof id === 'string')) {
            return
        }

        this._ensureNodeFor(filter)
        this._filterChain(fitler, this._indexOf(filter.id))
        this.refreshSpan()
    }

    refilter() {
        const first = this.#filters[0]
        if (first) {
            this.filter(first.filter)
        }
    }

    refreshSpan() {
        const lastFilter = this.#filters[this.#filters.length - 1]
        if (lastFilter.filteredCount >= 0) {
            this.#values.count = lastFilter.filteredCount
        }
    }

    /**
     * @param {Filter} filter
     * @param {number} filterIndex
     */
    _filterChain(filter, filterIndex) {
        const end = filterIndex > 0
            ? this.#filters[filterIndex - 1].filteredCount
            : this.#values.length

        const node = this.#filters[filterIndex]
        node.filteredCount = this._filter(filter, end)
        node.filter = filter

        const nextIndex = filterIndex + 1
        if (nextIndex < this.#filters.length) {
            this._filterChain(this.#filters[nextIndex].filter, nextIndex)
        }
    }

    /**
     * 
     * @param {Filter} filter
     * @param {number} end
     */
    _filter(filter, end) {
        let matched = 0

        while (matched < end) {
            const value = this.#values.at(matched)
            if (filter.isMatch(value)) {
                matched += 1
            }

            end -= 1
            this.#values.swap(matched, end)
        }

        return matched
    }

    /**
     * @param {Filter} filter
     */
    _ensureNodeFor(filter) {
        const index = this._indexOf(filter.id)
        if (index >= 0) {
            return this.#filters[index]
        }

        const node = new FiltersSequenceNode(filter)
        this.#filters.push(node)

        return node
    }

    /**
     * @param {string} id
     */
    _indexOf(id) {
        for (let i = 0; i < this.#filters.length; i++) {
            if (id === this.#filters[i].id) {
                return i
            }
        }

        return -1
    }
}

export class PaginationElement {
    hide() { }
    show() { }
}

export class HTMLPaginationElement extends PaginationElement {
    #element

    /**
     * @param {HTMLElement} element
     */
    constructor(element) {
        super()
        this.#element = element
    }

    hide() {
        this.#element.style.display = 'none'
    }

    show() {
        this.#element.style.display = ''
    }
}

export class TableRow extends HTMLPaginationElement {
    #htmlRow

    /**
     * @param {HTMLTableRowElement} htmlRow
     * @param {{column: string, index: number}} columnsCellMap
     */
    constructor(htmlRow, columnsCellMap) {
        super(htmlRow)

        this.#htmlRow = htmlRow
        if (!htmlRow || !htmlRow.cells) {
            return
        }

        for (const column in columnsCellMap) {
            const cellIndex = columnsCellMap[column]

            if (inRange(cellIndex, 0, htmlRow.cells)) {
                this[column] = cells[cellIndex]
            }
        }
    }

    get htmlRow() {
        return this.#htmlRow
    }
}

export class Pagination  {
    #size
    #rows
    #printed
    #page = 0

    /**
     * @param {ArraySpan<PaginationElement>} rows
     * @param {number} size
     */
    constructor(rows, size = 50) {
        if (size < 1) {
            throw new Error(`invalid page size value: ${size}`);
        }

        this.#size = size
        this.#rows = rows
        this.hideInitial(rows)

        /** @type {PaginationElement[]} */
        const printBuffer = []
        this.#printed = printBuffer
    }

    get page() {
        return this.#page
    }

    get size() {
        return this.#size
    }

    get totalPages() {
        return Pagination._getMaxPage(this.#size, this.#rows.count)
    }

    previous() {
        return this.open(this.#page - 1)
    }

    next() {
        return this.open(this.#page + 1)
    }

    /**
     * @param {number} page
     * @param {number} pageSize
     */
    open(page, pageSize = null) {
        if (pageSize === null) {
            pageSize = this.#size
        }
        else if (typeof pageSize !== 'number' || pageSize === NaN || pageSize <= 0) {
            return false
        }

        if (page <= 0 || page === NaN || page === this.#page) {
            return false
        }

        const maxPage = Pagination._getMaxPage(this.#size, this.#rows.count)
        if (page > maxPage) {
            return false
        }

        this._close()
        this._clear()
        this._show(page, pageSize)

        this.#page = page
        return true
    }

    _close() {
        for (let i = 0; i < this.#printed.length; i++) {
            this.#printed[i].hide()
        }
    }

    _clear() {
        this.#printed.splice(0)
    }

    /**
     * @param {number} page
     * @param {number} pageSize
     */
    _show(page, pageSize) {
        const elementIndex = (page - 1) * pageSize
        const end = Math.min(elementIndex + pageSize, this.#rows.count)

        for (let i = 0; i < end; i++) {
            const row = this.#rows.at(i)

            this.#printed.push(row)
            row.show()
        }
    }

    /**
     * @param {ArraySpan<TableRow>} rows
     */
    hideInitial(rows) {
        for (const row of rows) {
            row.hide()
        }
    }

    /**
     * @param {number} pageSize
     * @param {number} totalCount
     */
    static _getMaxPage(pageSize, totalCount) {
        return totalCount > 0 && pageSize > 0
            ? Math.ceil(totalCount / pageSize)
            : 0
    }
}

