ITEMS_PER_PAGE = 10


def paginate(items, page: int = 1, per_page: int = ITEMS_PER_PAGE):
    page = max(1, page)
    total = len(items)
    total_pages = max(1, (total + per_page - 1) // per_page)
    if page > total_pages:
        page = total_pages
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "records": items[start:end],
        "page": page,
        "total_pages": total_pages,
        "total_items": total,
        "per_page": per_page,
    }
