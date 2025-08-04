const pageUrl = process.env.APP_URL || 'http://localhost:3000';

exports.pagination = (size_num, page_num, count, path) => {
  let size = parseInt(size_num) || 10;
  let page = parseInt(page_num) || 1;
  let skip = size * (page - 1);
  let pagesTotal = Math.ceil(count / size);

  return {
    size: size,
    page: page,
    skip: skip,
    total: pagesTotal,
    url: {
      first: `${pageUrl + path + url(size, 1)}`,
      last: `${pageUrl + path + url(size, pagesTotal)}`,
      next: `${pageUrl + path + url(size, page + 1)}`,
      prev: `${pageUrl + path + url(size, page - 1)}`
    }
  };

  function url(size, page) {
    return `size=${size}&page=${page}`;
  }
};

exports.paginationResponse = (count, paginate, rows) => {
  return {
    total: count,
    per_page: paginate.size,
    current_page: paginate.page,
    last_page: paginate.total,
    first_page_url: paginate.url.first,
    last_page_url: paginate.url.last,
    next_page_url: paginate.page != paginate.total ? paginate.url.next : null,
    prev_page_url: paginate.page > 1 ? paginate.url.prev : null,
    rows: rows
  };
}